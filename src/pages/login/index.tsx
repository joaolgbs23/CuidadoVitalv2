import React, { useState } from 'react';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    View,
} from 'react-native';

import Input from '../../components/Input';
import Logo from '../../assets/Logo.png';
import { mensagemDeErro, useAuth } from '../../contexts/AuthContext';
import { AuthError } from '../../services/autenticacao';
import { formatarCpf, pareceCpf } from '../../utils/validacao';
import { styles } from './styles';
import { theme } from '../../global/themes';

type LoginProps = {
    onCadastroPress: () => void;
};

export default function Login({ onCadastroPress }: LoginProps) {
    const { fazerLogin } = useAuth();

    /** Alterna entre digitar e-mail e digitar CPF (com mascara). */
    const [modoCpf, setModoCpf] = useState(false);
    const [identificador, setIdentificador] = useState('');
    const [senha, setSenha] = useState('');
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [erro, setErro] = useState<string | null>(null);
    const [campoComErro, setCampoComErro] = useState<string | null>(null);
    const [enviando, setEnviando] = useState(false);

    function aoDigitarIdentificador(valor: string) {
        // Aplica a mascara quando o campo esta em modo CPF ou quando o usuario
        // claramente digitou um CPF no campo de e-mail.
        setIdentificador(modoCpf || pareceCpf(valor) ? formatarCpf(valor) : valor);
        setErro(null);
        setCampoComErro(null);
    }

    function alternarModo() {
        setModoCpf((atual) => !atual);
        setIdentificador('');
        setErro(null);
        setCampoComErro(null);
    }

    async function aoEntrar() {
        if (enviando) {
            return;
        }

        setEnviando(true);
        setErro(null);
        setCampoComErro(null);

        try {
            await fazerLogin(identificador, senha);
            // Em caso de sucesso o App troca de tela sozinho, observando a sessao.
        } catch (falha) {
            setErro(mensagemDeErro(falha));
            setCampoComErro(falha instanceof AuthError ? (falha.campo ?? null) : null);
        } finally {
            setEnviando(false);
        }
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.logoContainer}>
                    <Image source={Logo} style={styles.boxImage} />
                    <Text style={styles.logoText}>Bem-vindo de volta</Text>
                </View>

                <View style={styles.box}>
                    <Input
                        placeholder={modoCpf ? 'Digite seu CPF' : 'Digite seu E-mail ou CPF'}
                        value={identificador}
                        onChangeText={aoDigitarIdentificador}
                        iconLeftName="account-outline"
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType={modoCpf ? 'number-pad' : 'email-address'}
                        textContentType="username"
                        editable={!enviando}
                        erro={campoComErro === 'identificador' ? erro : null}
                    />

                    <Input
                        value={senha}
                        onChangeText={(valor) => {
                            setSenha(valor);
                            setErro(null);
                            setCampoComErro(null);
                        }}
                        placeholder="Digite sua senha"
                        secureTextEntry={!mostrarSenha}
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!enviando}
                        onSubmitEditing={aoEntrar}
                        returnKeyType="go"
                        iconLeftName="lock-outline"
                        iconRightName={mostrarSenha ? 'eye-off-outline' : 'eye-outline'}
                        iconRightPress={() => setMostrarSenha((visivel) => !visivel)}
                        erro={campoComErro === 'senha' ? erro : null}
                    />

                    <Text style={styles.esqueceuSenha}>Esqueceu a senha?</Text>

                    {erro && !campoComErro ? <Text style={styles.erro}>{erro}</Text> : null}

                    <Pressable
                        style={[styles.button, enviando && styles.buttonDisabled]}
                        onPress={aoEntrar}
                        disabled={enviando}
                        accessibilityRole="button"
                        accessibilityState={{ disabled: enviando, busy: enviando }}
                    >
                        {enviando ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.buttonText}>Entrar</Text>
                        )}
                    </Pressable>

                    <Text style={styles.link} onPress={alternarModo}>
                        {modoCpf ? 'Entrar com e-mail' : 'Entrar com CPF'}
                    </Text>

                    <Text style={styles.link}>
                        Não possui uma conta?{' '}
                        <Text style={styles.linkForte} onPress={onCadastroPress}>
                            Cadastre-se
                        </Text>
                    </Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
