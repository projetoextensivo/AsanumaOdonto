package br.com.asanumaodonto.service;

import br.com.asanumaodonto.api.ApiException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class AuthServiceTest {

    @Test
    @DisplayName("Codificar senha quando acionado deve gerar uma senha diferente da original")
    void codificarSenhaDeveGerarSenhaDiferente() {
        String senha = "Senha123";
        AuthService authService = new AuthService(null);

        String resposta = authService.encode(senha);

        assertEquals(false, senha.equals(resposta));
    }

    @Test
    @DisplayName("Validar senha quando a senha estiver correta deve retornar verdadeiro")
    void validarSenhaCorretaDeveRetornarVerdadeiro() {
        AuthService authService = new AuthService(null);
        String senha = "Senha123";
        String senhaCodificada = authService.encode(senha);

        boolean resposta = authService.matches(senha, senhaCodificada);

        assertEquals(true, resposta);
    }

    @Test
    @DisplayName("Validar senha quando a senha estiver incorreta deve retornar falso")
    void validarSenhaIncorretaDeveRetornarFalso() {
        AuthService authService = new AuthService(null);
        String senhaCodificada = authService.encode("Senha123");

        boolean resposta = authService.matches("SenhaErrada", senhaCodificada);

        assertEquals(false, resposta);
    }

    @Test
    @DisplayName("Montar usuário público deve remover informações privadas")
    void montarUsuarioPublicoDeveRemoverInformacoesPrivadas() {
        Map<String, Object> usuario = new HashMap<>();
        usuario.put("id", "1");
        usuario.put("name", "Maria");
        usuario.put("password", "senha");
        usuario.put("active", true);
        AuthService authService = new AuthService(null);

        Map<String, Object> resposta = authService.publicUser(usuario);

        assertEquals("Maria", resposta.get("name"));
        assertEquals(false, resposta.containsKey("password"));
        assertEquals(false, resposta.containsKey("active"));
    }

    @Test
    @DisplayName("Verificar administrador quando o usuário for administrador deve retornar verdadeiro")
    void verificarAdministradorDeveRetornarVerdadeiro() {
        Map<String, Object> usuario = new HashMap<>();
        usuario.put("role", "Administrador");
        AuthService authService = new AuthService(null);

        boolean resposta = authService.admin(usuario);

        assertEquals(true, resposta);
    }

    @Test
    @DisplayName("Verificar administrador quando o usuário for secretária deve retornar falso")
    void verificarSecretariaComoAdministradorDeveRetornarFalso() {
        Map<String, Object> usuario = new HashMap<>();
        usuario.put("role", "Secretária");
        AuthService authService = new AuthService(null);

        boolean resposta = authService.admin(usuario);

        assertEquals(false, resposta);
    }

    @Test
    @DisplayName("Exigir administrador quando o usuário não for administrador deve lançar exceção")
    void exigirAdministradorComUsuarioSecretariaDeveLancarExcecao() {
        Map<String, Object> usuario = new HashMap<>();
        usuario.put("role", "Secretária");
        AuthService authService = new AuthService(null);

        assertThrows(ApiException.class, () -> authService.requireAdmin(usuario));
    }
}
