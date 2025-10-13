export const initialFormState = {
  form: {
    protocolo: "",
    assunto: "",
    data_hora_ocorrencia: "",
    linha: "",
    numero_veiculo: "",
    local_ocorrencia: "",
    tipo_onibus: "",
    descricao: "",
    anexos: [],
    quer_retorno: false,
    nome_completo: "",
    email: "",
    telefone: "",
    lgpd_aceite: false,
    status: "Pendente",
    prazo_sla: "",
  },
  errors: {},
  feedback: { type: null, message: "" },
  isSubmitting: false,
  ip: "",
};

export function formReducer(state, action) {
  switch (action.type) {
    case "UPDATE_FIELD":
      return {
        ...state,
        form: {
          ...state.form,
          [action.field]: action.value
        },
        errors: {
          ...state.errors,
          [action.field]: undefined
        }
      };

    case "SET_ERRORS":
      return {
        ...state,
        errors: action.errors
      };

    case "SET_FEEDBACK":
      return {
        ...state,
        feedback: action.feedback
      };

    case "SET_SUBMITTING":
      return {
        ...state,
        isSubmitting: action.isSubmitting
      };

    case "SET_IP":
      return {
        ...state,
        ip: action.ip
      };

    case "RESET_FORM":
      return {
        ...initialFormState,
        ip: state.ip // Mantém o IP
      };

    default:
      return state;
  }
}