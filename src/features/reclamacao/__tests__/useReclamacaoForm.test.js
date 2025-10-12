import { renderHook, act } from '@testing-library/react';
import { useReclamacaoForm } from '../hooks/useReclamacaoForm';
import { MIN_DESCRICAO_LENGTH } from '../constants';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock do serviço de upload de anexos
jest.mock('../../../services/attachments', () => ({
  uploadAttachments: jest.fn().mockResolvedValue([{
    id: 'test-file-id',
    name: 'test.jpg',
    mime_type: 'image/jpeg',
    size: 1024,
    url: 'https://drive.google.com/file/d/test-file-id'
  }])
}));

describe('useReclamacaoForm', () => {
  beforeEach(() => {
    // Limpa os mocks entre os testes
    jest.clearAllMocks();
  });

  it('deve inicializar com valores padrão', () => {
    const { result } = renderHook(() => useReclamacaoForm());
    
    expect(result.current.form).toEqual({
      protocolo: '',
      assunto: '',
      data_hora_ocorrencia: '',
      linha: '',
      numero_veiculo: '',
      local_ocorrencia: '',
      tipo_onibus: '',
      descricao: '',
      anexos: [],
      quer_retorno: false,
      nome_completo: '',
      email: '',
      telefone: '',
      lgpd_aceite: false,
      status: 'Pendente',
      prazo_sla: '',
    });
    expect(result.current.step).toBe(1);
    expect(result.current.errors).toEqual({});
    expect(result.current.sending).toBe(false);
  });

  it('deve validar campos obrigatórios do passo 1', () => {
    const { result } = renderHook(() => useReclamacaoForm());

    act(() => {
      result.current.goNext();
    });

    expect(result.current.errors).toEqual({
      assunto: 'Selecione um assunto.',
      data_hora_ocorrencia: 'Informe data e hora.',
      linha: 'Selecione a linha.',
      local_ocorrencia: 'Informe o local.',
    });
    expect(result.current.step).toBe(1);
  });

  it('deve avançar para o próximo passo quando dados são válidos', () => {
    const { result } = renderHook(() => useReclamacaoForm());

    act(() => {
      result.current.update('assunto', 'Atraso');
      result.current.update('data_hora_ocorrencia', '2025-10-12T10:00');
      result.current.update('linha', '9105 - NOVA VISTA/SION');
      result.current.update('local_ocorrencia', 'Av. Afonso Pena');
    });

    act(() => {
      result.current.goNext();
    });

    expect(result.current.step).toBe(2);
    expect(result.current.errors).toEqual({});
  });

  it('deve validar tamanho mínimo da descrição no passo 2', () => {
    const { result } = renderHook(() => useReclamacaoForm());

    // Avança para o passo 2
    act(() => {
      result.current.update('assunto', 'Atraso');
      result.current.update('data_hora_ocorrencia', '2025-10-12T10:00');
      result.current.update('linha', '9105 - NOVA VISTA/SION');
      result.current.update('local_ocorrencia', 'Av. Afonso Pena');
      result.current.goNext();
    });

    // Tenta avançar com descrição curta
    act(() => {
      result.current.update('descricao', 'Curta');
      result.current.goNext();
    });

    expect(result.current.errors).toEqual({
      descricao: `Mínimo de ${MIN_DESCRICAO_LENGTH} caracteres.`
    });
    expect(result.current.step).toBe(2);
  });

  it('deve validar campos de contato no passo 3', () => {
    const { result } = renderHook(() => useReclamacaoForm());

    // Preenche e avança os passos anteriores
    act(() => {
      result.current.update('assunto', 'Atraso');
      result.current.update('data_hora_ocorrencia', '2025-10-12T10:00');
      result.current.update('linha', '9105 - NOVA VISTA/SION');
      result.current.update('local_ocorrencia', 'Av. Afonso Pena');
      result.current.goNext();

      result.current.update('descricao', 'Uma descrição com tamanho adequado para o teste de validação');
      result.current.goNext();
    });

    // Tenta enviar sem preencher campos obrigatórios
    act(() => {
      result.current.handleSubmit();
    });

    expect(result.current.errors).toEqual({
      nome_completo: 'Informe seu nome.',
      email: 'Informe e-mail ou telefone.',
      telefone: 'Informe e-mail ou telefone.',
      lgpd_aceite: 'É necessário aceitar a LGPD.',
    });
  });

  it('deve aceitar envio com email ou telefone', () => {
    const { result } = renderHook(() => useReclamacaoForm());

    // Preenche dados básicos
    act(() => {
      result.current.update('assunto', 'Atraso');
      result.current.update('data_hora_ocorrencia', '2025-10-12T10:00');
      result.current.update('linha', '9105 - NOVA VISTA/SION');
      result.current.update('local_ocorrencia', 'Av. Afonso Pena');
      result.current.goNext();

      result.current.update('descricao', 'Uma descrição com tamanho adequado para o teste de validação');
      result.current.goNext();

      result.current.update('nome_completo', 'João Silva');
      result.current.update('email', 'joao@email.com');
      result.current.update('lgpd_aceite', true);
    });

    // Tenta enviar com apenas email
    act(() => {
      result.current.handleSubmit();
    });

    expect(result.current.errors).toEqual({});

    // Tenta enviar com apenas telefone
    act(() => {
      result.current.update('email', '');
      result.current.update('telefone', '31999999999');
      result.current.handleSubmit();
    });

    expect(result.current.errors).toEqual({});
  });

  it('deve gerar protocolo apenas no momento do envio', async () => {
    const { result } = renderHook(() => useReclamacaoForm());

    // Preenche o formulário completo
    act(() => {
      result.current.update('assunto', 'Atraso');
      result.current.update('data_hora_ocorrencia', '2025-10-12T10:00');
      result.current.update('linha', '9105 - NOVA VISTA/SION');
      result.current.update('local_ocorrencia', 'Av. Afonso Pena');
      result.current.goNext();

      result.current.update('descricao', 'Uma descrição com tamanho adequado para o teste de validação');
      result.current.goNext();

      result.current.update('nome_completo', 'João Silva');
      result.current.update('email', 'joao@email.com');
      result.current.update('lgpd_aceite', true);
    });

    // Verifica que não tem protocolo antes do envio
    expect(result.current.form.protocolo).toBe('');

    // Envia o formulário
    await act(async () => {
      await result.current.handleSubmit();
    });

    // Verifica que o protocolo foi gerado
    expect(result.current.form.protocolo).toMatch(/^TOP-\d+$/);
  });
});