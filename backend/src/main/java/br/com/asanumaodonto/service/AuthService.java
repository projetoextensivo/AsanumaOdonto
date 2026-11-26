package br.com.asanumaodonto.service;

import java.util.*;
import java.time.*;
import br.com.asanumaodonto.api.ApiException;
import br.com.asanumaodonto.repository.ClinicRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private static final ZoneId CLINIC_ZONE = ZoneId.of("America/Sao_Paulo");
    private static final int MAX_FAILED_LOGINS = 3;
    private static final int LOCK_MINUTES = 5;
    private final ClinicRepository repo;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public AuthService(ClinicRepository repo) {
        this.repo = repo;
    }

    public String encode(String password) {
        return encoder.encode(password);
    }

    public boolean matches(String raw, String encoded) {
        return encoder.matches(raw, encoded);
    }

    public Map<String, Object> publicUser(Map<String, Object> u) {
        Map<String, Object> p = new HashMap<>(u);
        for (String key : List.of("password", "active", "failedLoginAttempts", "lockedUntil"))
            p.remove(key);
        return p;
    }

    public Map<String, Object> current(HttpServletRequest req) {
        var session = req.getSession(false);
        if (session == null)
            throw new ApiException("Entre na sua conta para continuar.", 401);
        Object id = session.getAttribute("userId");
        var u = id == null && session.getAttribute("email") != null
                ? repo.user(session.getAttribute("email").toString())
                : id == null ? null : repo.userById(id.toString());
        if (u == null)
            throw new ApiException("Entre na sua conta para continuar.", 401);
        if (!Boolean.TRUE.equals(u.get("active"))) {
            session.invalidate();
            throw new ApiException("Esta conta está inativa. Procure uma administradora.", 403);
        }
        if (isLocked(u, now())) {
            session.invalidate();
            throw new ApiException("Esta conta está temporariamente bloqueada.", 423);
        }
        session.setAttribute("userId", u.get("id"));
        return u;
    }

    public boolean admin(Map<String, Object> u) {
        return "Administrador".equals(u.get("role"));
    }

    public void requireAdmin(Map<String, Object> u) {
        if (!admin(u))
            throw new ApiException("Acesso exclusivo da administradora.", 403);
    }

    @Transactional(noRollbackFor = ApiException.class)
    public Map<String, Object> login(Map<String, Object> b, HttpServletRequest req) {
        var u = repo.userForLogin(text(b, "email").toLowerCase(Locale.ROOT));
        if (u == null)
            throw new ApiException("E-mail ou senha incorretos.", 401);
        if (!Boolean.TRUE.equals(u.get("active")))
            throw new ApiException("Esta conta está inativa. Procure uma administradora.", 403);
        LocalDateTime now = now();
        if (isLocked(u, now))
            throw new ApiException(lockMessage((LocalDateTime) u.get("lockedUntil"), now), 423);
        int attempts = ((Number) u.get("failedLoginAttempts")).intValue();
        if (u.get("lockedUntil") instanceof LocalDateTime until && !until.isAfter(now)) {
            attempts = 0;
            repo.resetFailedLogin(u.get("id").toString());
        }
        if (!matches(text(b, "password"), u.get("password").toString())) {
            attempts++;
            LocalDateTime until = attempts >= MAX_FAILED_LOGINS ? now.plusMinutes(LOCK_MINUTES) : null;
            repo.recordFailedLogin(u.get("id").toString(), attempts, until);
            if (until != null)
                throw new ApiException("Conta bloqueada por 5 minutos após 3 tentativas com senha incorreta.", 423);
            throw new ApiException("E-mail ou senha incorretos.", 401);
        }
        repo.resetFailedLogin(u.get("id").toString());
        if (req.getSession(false) != null)
            req.getSession(false).invalidate();
        var session = req.getSession(true);
        session.setAttribute("userId", u.get("id"));
        session.setAttribute("email", u.get("email"));
        session.setMaxInactiveInterval(Boolean.FALSE.equals(b.get("remember")) ? 43200 : 604800);
        return publicUser(u);
    }

    public Map<String, Object> register(Map<String, Object> b, HttpServletRequest req) {
        String email = text(b, "email").toLowerCase(Locale.ROOT), password = text(b, "password");
        if (!text(b, "role").isEmpty() && !List.of("Secretária", "Recepcionista").contains(text(b, "role")))
            throw new ApiException("O cadastro público permite apenas secretárias.", 403);
        if (text(b, "name").length() < 3 || !email.matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+") || password.length() < 8
                || password.length() > 72 || !password.equals(text(b, "confirmPassword"))
                || !Boolean.TRUE.equals(b.get("terms")))
            throw new ApiException("Confira nome, e-mail, senha, confirmação e aceite dos termos.");
        if (repo.user(email) != null)
            throw new ApiException("Este e-mail já possui uma conta.", 409);
        repo.addUser(new HashMap<>(Map.of("id", UUID.randomUUID().toString(), "email", email, "name", text(b, "name"),
                "role", "Secretária", "password", encode(password))));
        return login(b, req);
    }

    public Map<String, Object> account(Map<String, Object> b, Map<String, Object> u) {
        if (text(b, "name").isEmpty())
            throw new ApiException("Informe seu nome.");
        String currentPassword = text(b, "currentPassword");
        String newPassword = text(b, "newPassword");
        if (currentPassword.isEmpty() != newPassword.isEmpty())
            throw new ApiException("Para alterar a senha, informe a senha atual e a nova senha.");
        if (!newPassword.isEmpty()) {
            if (!matches(currentPassword, text(u, "password")))
                throw new ApiException("A senha atual está incorreta.");
            validatePassword(newPassword);
            u.put("password", encode(newPassword));
        }
        u.put("name", text(b, "name"));
        repo.updateUser(u);
        return publicUser(u);
    }

    public List<Map<String, Object>> users(Map<String, Object> actor) {
        requireAdmin(actor);
        LocalDateTime now = now();
        return repo.users().stream().map(u -> {
            Map<String, Object> out = publicUser(u);
            out.put("status", status(u, now));
            if (isLocked(u, now))
                out.put("lockedUntil", u.get("lockedUntil").toString());
            return out;
        }).toList();
    }

    @Transactional
    public Map<String, Object> createUser(Map<String, Object> b, Map<String, Object> actor) {
        requireAdmin(actor);
        repo.lockUserManagement();
        String name = text(b, "name"), email = normalizedEmail(b), role = text(b, "role"),
                password = text(b, "password");
        validateManagedUser(name, email, role);
        validatePassword(password);
        String status = text(b, "status").isEmpty() ? "Ativo" : text(b, "status");
        validateManagedStatus(status);
        Map<String, Object> user = new HashMap<>(Map.of("id", UUID.randomUUID().toString(), "name", name, "email",
                email, "role", role, "password", encode(password), "active", "Ativo".equals(status)));
        repo.addUser(user);
        return publicUser(user);
    }

    @Transactional
    public Map<String, Object> updateManagedUser(String id, Map<String, Object> b, Map<String, Object> actor) {
        requireAdmin(actor);
        repo.lockUserManagement();
        if (id.equals(actor.get("id")))
            throw new ApiException("Edite os dados da sua própria conta em Configurações.", 403);
        Map<String, Object> user = repo.userById(id);
        if (user == null)
            throw new ApiException("Usuário não encontrado.", 404);
        String name = text(b, "name"), email = normalizedEmail(b), role = text(b, "role");
        validateManagedUser(name, email, role);
        String status = text(b, "status");
        validateManagedStatus(status);
        boolean active = "Ativo".equals(status);
        if ("Administrador".equals(user.get("role")) && Boolean.TRUE.equals(user.get("active"))
                && (!"Administrador".equals(role) || !active) && repo.countActiveAdministrators() <= 1)
            throw new ApiException("O sistema precisa manter pelo menos uma administradora ativa.", 409);
        user.put("name", name);
        user.put("email", email);
        user.put("role", role);
        user.put("active", active);
        String password = text(b, "password");
        if (!password.isEmpty()) {
            validatePassword(password);
            user.put("password", encode(password));
        }
        repo.updateUser(user);
        return publicUser(user);
    }

    @Transactional
    public void deleteManagedUser(String id, Map<String, Object> actor) {
        requireAdmin(actor);
        repo.lockUserManagement();
        if (id.equals(actor.get("id")))
            throw new ApiException("Não é possível excluir a própria conta.", 403);
        Map<String, Object> user = repo.userById(id);
        if (user == null)
            throw new ApiException("Usuário não encontrado.", 404);
        if ("Administrador".equals(user.get("role")) && Boolean.TRUE.equals(user.get("active"))
                && repo.countActiveAdministrators() <= 1)
            throw new ApiException("O sistema precisa manter pelo menos uma administradora ativa.", 409);
        repo.deleteUser(id);
    }

    @Transactional
    public Map<String, Object> unlockUser(String id, Map<String, Object> actor) {
        requireAdmin(actor);
        repo.lockUserManagement();
        Map<String, Object> user = repo.userById(id);
        if (user == null)
            throw new ApiException("Usuário não encontrado.", 404);
        repo.resetFailedLogin(id);
        user.put("failedLoginAttempts", 0);
        user.put("lockedUntil", null);
        return userForManagement(user);
    }

    private Map<String, Object> userForManagement(Map<String, Object> u) {
        Map<String, Object> out = publicUser(u);
        LocalDateTime now = now();
        out.put("status", status(u, now));
        if (isLocked(u, now))
            out.put("lockedUntil", u.get("lockedUntil").toString());
        return out;
    }

    private void validateManagedStatus(String status) {
        if (!List.of("Ativo", "Inativo").contains(status))
            throw new ApiException("Selecione a situação ativa ou inativa.");
    }

    private LocalDateTime now() {
        return LocalDateTime.now(CLINIC_ZONE);
    }

    private boolean isLocked(Map<String, Object> u, LocalDateTime now) {
        return u.get("lockedUntil") instanceof LocalDateTime until && until.isAfter(now);
    }

    private String status(Map<String, Object> u, LocalDateTime now) {
        if (!Boolean.TRUE.equals(u.get("active")))
            return "Inativo";
        return isLocked(u, now) ? "Bloqueado" : "Ativo";
    }

    private String lockMessage(LocalDateTime until, LocalDateTime now) {
        long seconds = Math.max(1, Duration.between(now, until).toSeconds());
        long minutes = Math.max(1, (seconds + 59) / 60);
        return "Conta bloqueada. Tente novamente em " + minutes + " minuto(s) ou peça o desbloqueio à administradora.";
    }

    private String normalizedEmail(Map<String, Object> b) {
        return text(b, "email").toLowerCase(Locale.ROOT);
    }

    private void validateManagedUser(String name, String email, String role) {
        if (name.length() < 3 || name.length() > 150)
            throw new ApiException("Informe um nome entre 3 e 150 caracteres.");
        if (email.length() > 254 || !email.matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+"))
            throw new ApiException("Informe um e-mail válido.");
        if (!List.of("Administrador", "Secretária").contains(role))
            throw new ApiException("Selecione um perfil válido.");
    }

    private void validatePassword(String password) {
        if (password.length() < 8 || password.length() > 72)
            throw new ApiException("A senha deve ter entre 8 e 72 caracteres.");
    }

    public static String text(Map<String, Object> b, String key) {
        return Objects.toString(b.get(key), "").trim();
    }
}
