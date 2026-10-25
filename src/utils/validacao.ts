/**
 * Validacao e normalizacao dos campos de login e cadastro.
 */

/** Mantem apenas os digitos de um texto (usado para CPF). */
export function apenasDigitos(texto: string): string {
    return texto.replace(/\D/g, '');
}

/** Normaliza e-mail para comparacao: sem espacos nas pontas e em minusculas. */
export function normalizarEmail(email: string): string {
    return email.trim().toLowerCase();
}

/** Aplica a mascara 000.000.000-00 conforme o usuario digita. */
export function formatarCpf(valor: string): string {
    const digitos = apenasDigitos(valor).slice(0, 11);

    if (digitos.length <= 3) return digitos;
    if (digitos.length <= 6) return `${digitos.slice(0, 3)}.${digitos.slice(3)}`;
    if (digitos.length <= 9) return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6)}`;
    return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`;
}

/**
 * Checagem simples de e-mail: um `@`, algo antes, e um dominio com ponto.
 * Nao tenta cobrir a RFC 5322 inteira - isso rejeitaria enderecos validos e
 * daria falsa sensacao de seguranca. A confirmacao real vira do envio de e-mail.
 */
export function emailValido(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizarEmail(email));
}

/**
 * Valida CPF pelos dois digitos verificadores (modulo 11).
 * Rejeita tambem as sequencias repetidas (000.000.000-00, 111..., etc.), que
 * passam no calculo mas nao sao CPFs reais.
 */
export function cpfValido(valor: string): boolean {
    const cpf = apenasDigitos(valor);

    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
        return false;
    }

    const calcularDigito = (quantidade: number): number => {
        let soma = 0;
        for (let i = 0; i < quantidade; i += 1) {
            soma += Number(cpf[i]) * (quantidade + 1 - i);
        }
        const resto = (soma * 10) % 11;
        return resto === 10 ? 0 : resto;
    };

    return calcularDigito(9) === Number(cpf[9]) && calcularDigito(10) === Number(cpf[10]);
}

export const SENHA_TAMANHO_MINIMO = 8;

/**
 * Regras de senha: tamanho minimo, ao menos uma letra e ao menos um numero.
 * Devolve a mensagem do primeiro problema encontrado, ou `null` se estiver ok.
 */
export function validarSenha(senha: string): string | null {
    if (senha.length < SENHA_TAMANHO_MINIMO) {
        return `A senha precisa ter pelo menos ${SENHA_TAMANHO_MINIMO} caracteres.`;
    }
    if (!/[A-Za-zÀ-ÿ]/.test(senha)) {
        return 'A senha precisa ter pelo menos uma letra.';
    }
    if (!/\d/.test(senha)) {
        return 'A senha precisa ter pelo menos um número.';
    }
    return null;
}

/** Nome completo: pelo menos duas partes, cada uma com duas letras ou mais. */
export function nomeValido(nome: string): boolean {
    const partes = nome.trim().split(/\s+/).filter((parte) => parte.length >= 2);
    return partes.length >= 2;
}

/** Colapsa espacos repetidos do nome antes de gravar. */
export function normalizarNome(nome: string): string {
    return nome.trim().replace(/\s+/g, ' ');
}

/** Decide se o texto digitado no login deve ser tratado como CPF. */
export function pareceCpf(identificador: string): boolean {
    const digitos = apenasDigitos(identificador);
    return digitos.length === 11 && !identificador.includes('@');
}
