
package br.com.asanumaodonto;

import java.util.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.http.MediaType;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties = { "spring.datasource.url=jdbc:h2:mem:tests;DB_CLOSE_DELAY=-1", "clinic.demo=true",
        "clinic.admin.email=", "clinic.admin.password=" })
@AutoConfigureMockMvc
class ClinicApiTest {
    @Autowired
    MockMvc mvc;
    @Autowired
    ObjectMapper json;

    @Test
    void rolesSchedulingAndConflicts() throws Exception {
        mvc.perform(get("/api/bootstrap")).andExpect(status().isUnauthorized());
        var login = mvc
                .perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(
                        json.writeValueAsString(Map.of("email", "demo@asanumaodonto.com", "password", "Odonto@2026"))))
                .andExpect(status().isOk()).andReturn();
        var admin = (MockHttpSession) login.getRequest().getSession();
        mvc.perform(get("/api/procedures").session(admin)).andExpect(status().isOk());
        var clinicSettings = new HashMap<String, Object>(Map.of(
                "clinicName", "Asanuma Odonto",
                "phone", "(11) 99999-8888",
                "email", "contato@example.com",
                "address", "Rua de Teste, 123",
                "openTime", "08:00",
                "closeTime", "18:00"));
        for (String requiredField : List.of("phone", "email", "address")) {
            var incompleteSettings = new HashMap<>(clinicSettings);
            incompleteSettings.remove(requiredField);
            mvc.perform(put("/api/settings").session(admin).contentType(MediaType.APPLICATION_JSON)
                    .content(json.writeValueAsString(incompleteSettings))).andExpect(status().isBadRequest());
        }
        var invalidClinicPhone = new HashMap<>(clinicSettings);
        invalidClinicPhone.put("phone", "123");
        mvc.perform(put("/api/settings").session(admin).contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(invalidClinicPhone))).andExpect(status().isBadRequest());
        var invalidClinicEmail = new HashMap<>(clinicSettings);
        invalidClinicEmail.put("email", "email-invalido");
        mvc.perform(put("/api/settings").session(admin).contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(invalidClinicEmail))).andExpect(status().isBadRequest());
        mvc.perform(put("/api/settings").session(admin).contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(clinicSettings))).andExpect(status().isOk());

        mvc.perform(put("/api/account").session(admin).contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("name", "Lucas Maximo", "newPassword", "SenhaNova@2026"))))
                .andExpect(status().isBadRequest());
        mvc.perform(put("/api/account").session(admin).contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("name", "Lucas Maximo", "currentPassword", "Odonto@2026"))))
                .andExpect(status().isBadRequest());
        mvc.perform(put("/api/account").session(admin).contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("name", "Lucas Maximo"))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.name").value("Lucas Maximo"));

        var signup = new HashMap<String, Object>(Map.of("name", "Secretária Teste", "email", "secretaria@example.com",
                "password", "Senha@2026", "confirmPassword", "Senha@2026", "terms", true, "role", "Administrador"));
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(signup))).andExpect(status().isForbidden());
        signup.put("role", "Secretária");
        var registered = mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(signup))).andExpect(status().isOk()).andReturn();
        var secretary = (MockHttpSession) registered.getRequest().getSession();
        for (String route : List.of("/api/procedures", "/api/records", "/api/dashboard"))
            mvc.perform(get(route).session(secretary)).andExpect(status().isForbidden());
        mvc.perform(put("/api/settings").session(secretary).contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/bootstrap").session(secretary)).andExpect(jsonPath("$.procedures").isEmpty())
                .andExpect(jsonPath("$.records").isEmpty())
                .andExpect(jsonPath("$.appointments[0].price").doesNotExist())
                .andExpect(jsonPath("$.appointmentOptions[0].price").doesNotExist())
                .andExpect(jsonPath("$.patients[0].age").doesNotExist());
        var patientData = new HashMap<String, Object>();
        patientData.put("name", "Paciente Spring");
        patientData.put("phone", "11999998888");
        patientData.put("email", "paciente@example.com");
        patientData.put("birthDate", "1990-04-15");
        patientData.put("cpf", "31415926590");
        patientData.put("status", "Ativo");
        for (String requiredField : List.of("cpf", "email", "birthDate")) {
            var invalidPatient = new HashMap<>(patientData);
            invalidPatient.remove(requiredField);
            mvc.perform(post("/api/patients").session(secretary).contentType(MediaType.APPLICATION_JSON)
                    .content(json.writeValueAsString(invalidPatient))).andExpect(status().isBadRequest());
        }
        var invalidCpf = new HashMap<>(patientData);
        invalidCpf.put("cpf", "11111111111");
        mvc.perform(post("/api/patients").session(secretary).contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(invalidCpf))).andExpect(status().isBadRequest());
        var invalidEmail = new HashMap<>(patientData);
        invalidEmail.put("email", "email-invalido");
        mvc.perform(post("/api/patients").session(secretary).contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(invalidEmail))).andExpect(status().isBadRequest());
        var futureBirthDate = new HashMap<>(patientData);
        futureBirthDate.put("birthDate", "2099-01-01");
        mvc.perform(post("/api/patients").session(secretary).contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(futureBirthDate))).andExpect(status().isBadRequest());
        var p = mvc.perform(post("/api/patients").session(secretary).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(patientData)))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.insurance").doesNotExist())
                .andExpect(jsonPath("$.age").doesNotExist())
                .andExpect(jsonPath("$.cpf").value("31415926590"))
                .andExpect(jsonPath("$.email").value("paciente@example.com"))
                .andExpect(jsonPath("$.birthDate").value("1990-04-15")).andReturn();
        String patient = json.readTree(p.getResponse().getContentAsString()).get("id").asText();
        var appointment = new HashMap<String, Object>(Map.of("patientId", patient, "procedureId", "pr1", "date",
                "2030-10-21", "time", "09:00", "status", "Confirmada", "dentist", "Lucas Maximo", "payment", "Pix"));
        var missingDentist = new HashMap<>(appointment);
        missingDentist.remove("dentist");
        mvc.perform(post("/api/appointments").session(secretary).contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(missingDentist))).andExpect(status().isBadRequest());
        var created = mvc
                .perform(post("/api/appointments").session(secretary).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(appointment)))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.price").doesNotExist()).andReturn();
        String id = json.readTree(created.getResponse().getContentAsString()).get("id").asText();
        mvc.perform(post("/api/appointments").session(secretary).contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(appointment))).andExpect(status().isConflict());
        appointment.put("date", "2030-10-22");
        mvc.perform(put("/api/appointments/" + id).session(secretary).contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(appointment))).andExpect(status().isOk())
                .andExpect(jsonPath("$.date").value("2030-10-22"));
        appointment.put("date", "2030-10-20");
        mvc.perform(put("/api/appointments/" + id).session(secretary).contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(appointment))).andExpect(status().isBadRequest());
        mvc.perform(get("/api/appointments/" + id).session(secretary))
                .andExpect(jsonPath("$.date").value("2030-10-22"));
        mvc.perform(delete("/api/patients/" + patient).session(secretary)).andExpect(status().isForbidden());
        mvc.perform(post("/api/appointments").session(secretary).header("Origin", "https://external.example")
                .contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isForbidden());
        mvc.perform(post("/api/auth/logout").session(secretary)).andExpect(status().isOk());
    }
}
