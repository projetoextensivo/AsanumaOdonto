package br.com.asanumaodonto.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class ClinicServiceTest {

    @Test
    @DisplayName("Exibir paciente deve ocultar a idade")
    void exibirPacienteDeveOcultarIdade() {
        Map<String, Object> paciente = new HashMap<>();
        paciente.put("id", "1");
        paciente.put("name", "João");
        paciente.put("age", 30);
        ClinicService clinicService = new ClinicService(null, null);

        Map<String, Object> resposta = clinicService.visible("patients", paciente, true);

        assertEquals("João", resposta.get("name"));
        assertEquals(false, resposta.containsKey("age"));
    }

    @Test
    @DisplayName("Exibir agendamento para secretária deve ocultar preço e desconto")
    void exibirAgendamentoParaSecretariaDeveOcultarPrecoEDesconto() {
        Map<String, Object> agendamento = new HashMap<>();
        agendamento.put("id", "1");
        agendamento.put("price", 150);
        agendamento.put("discount", 10);
        ClinicService clinicService = new ClinicService(null, null);

        Map<String, Object> resposta = clinicService.visible("appointments", agendamento, false);

        assertEquals(false, resposta.containsKey("price"));
        assertEquals(false, resposta.containsKey("discount"));
    }

    @Test
    @DisplayName("Exibir agendamento para administrador deve manter preço e desconto")
    void exibirAgendamentoParaAdministradorDeveManterPrecoEDesconto() {
        Map<String, Object> agendamento = new HashMap<>();
        agendamento.put("price", 150);
        agendamento.put("discount", 10);
        ClinicService clinicService = new ClinicService(null, null);

        Map<String, Object> resposta = clinicService.visible("appointments", agendamento, true);

        assertEquals(150, resposta.get("price"));
        assertEquals(10, resposta.get("discount"));
    }
}
