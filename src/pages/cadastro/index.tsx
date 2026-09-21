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
import { formatarCpf } from '../../utils/validacao';
import { styles } from './styles';

type CadastroProps = {
    onLoginPress: () => void;
};

type Campo = 'nome' | 'cpf' | 'email' | 'senha' | 'confirmacaoSenha';

export default function Cadastro({ onLoginPress }: CadastroProps) {
    const { fazerCadastro } = useAuth();

    const [nome, setNome] = useState('');
    const [cpf, setCpf] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [confirmacaoSenha, setConfirmacaoSenha] = useState('');

    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
    const [aceitouTermos, setAceitouTermos] = useState(false);

    const [erro, setErro] = useState<string | null>(null);
    const [campoComErro, setCampoComErro] = useState<Campo | null>(null);
    const [enviando, setEnviando] = useState(false);

    /** Limpa a mensagem de erro assim que o usuario corrige algo. */
    function aoEditar<T>(setter: (valor: T) => void) {
        return (valor: T) => {
            setter(valor);
            setErro(null);
            setCampoComErro(null);
        };
    }

    async function aoCadastrar() {
        if (enviando) {
            return;
        }

        if (!aceitouTermos) {
            setErro('É preciso aceitar os Termos e Condições para criar a conta.');
            setCampoComErro(null);
            return;
        }

        setEnviando(true);
        setErro(null);
        setCampoComErro(null);

        try {
            await fazerCadastro({ nome, cpf, email, senha, confirmacaoSenha });
            // Cadastro bem-sucedido ja deixa o usuario logado; o App troca de tela.
        } catch (falha) {
            setErro(mensagemDeErro(falha));
            setCampoComErro(
                falha instanceof AuthError && falha.campo && falha.campo !== 'identificador'
                    ? falha.campo
                    : null,
            );
        } finally {
            setEnviando(false);
        }
    }

    const erroDoCampo = (campo: Campo) => (campoComErro === campo ? erro : null);

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
                    <Text style={styles.logoText}>Crie Sua Conta</Text>
                </View>

                <View style={styles.box}>
                    <Input
                        placeholder="Nome Completo"
                        iconLeftName="account-outline"
                        value={nome}
                        onChangeText={aoEditar(setNome)}
                        autoCapitalize="words"
                        editable={!enviando}
                        erro={erroDoCampo('nome')}
                    />
                    <Input
                        placeholder="CPF"
                        iconLeftName="file-document-outline"
                        value={cpf}
                        onChangeText={aoEditar((valor: string) => setCpf(formatarCpf(valor)))}
                        keyboardType="number-pad"
                        maxLength={14}
                        editable={!enviando}
                        erro={erroDoCampo('cpf')}
                    />
                    <Input
                        placeholder="E-mail"
                        iconLeftName="email-outline"
                        value={email}
                        onChangeText={aoEditar(setEmail)}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!enviando}
                        erro={erroDoCampo('email')}
                    />
                    <Input
                        placeholder="Senha"
                        iconLeftName="lock-outline"
                        value={senha}
                        onChangeText={aoEditar(setSenha)}
                        secureTextEntry={!mostrarSenha}
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!enviando}
                        iconRightName={mostrarSenha ? 'eye-off-outline' : 'eye-outline'}
                        iconRightPress={() => setMostrarSenha((visivel) => !visivel)}
                        erro={erroDoCampo('senha')}
                    />
                    <Input
                        placeholder="Confirmação de Senha"
                        iconLeftName="lock-outline"
                        value={confirmacaoSenha}
                        onChangeText={aoEditar(setConfirmacaoSenha)}
                        secureTextEntry={!mostrarConfirmacao}
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!enviando}
                        onSubmitEditing={aoCadastrar}
                        returnKeyType="go"
                        iconRightName={mostrarConfirmacao ? 'eye-off-outline' : 'eye-outline'}
                        iconRightPress={() => setMostrarConfirmacao((visivel) => !visivel)}
                        erro={erroDoCampo('confirmacaoSenha')}
                    />

                    <Pressable
                        style={styles.checkboxRow}
                        onPress={() => {
                            setAceitouTermos((aceito) => !aceito);
                            setErro(null);
                        }}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: aceitouTermos }}
                    >
                        <View style={[styles.checkbox, aceitouTermos && styles.checkboxChecked]}>
                            {aceitouTermos && <Text style={styles.checkmark}>✓</Text>}
                        </View>
                        <Text style={styles.terms}>
                            Aceito os <Text style={styles.termsLink}>Termos e Condições</Text>
                        </Text>
                    </Pressable>

                    {erro && !campoComErro ? <Text style={styles.erro}>{erro}</Text> : null}

                    <Pressable
                        style={[styles.button, enviando && styles.buttonDisabled]}
                        onPress={aoCadastrar}
                        disabled={enviando}
                        accessibilityRole="button"
                        accessibilityState={{ disabled: enviando, busy: enviando }}
                    >
                        {enviando ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.buttonText}>Cadastrar</Text>
                        )}
                    </Pressable>

                    <Text style={styles.loginText}>
                        Já tem conta?{' '}
                        <Text style={styles.loginLink} onPress={onLoginPress}>
                            Entrar
                        </Text>
                    </Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
