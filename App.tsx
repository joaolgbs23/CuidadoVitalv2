import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import Cadastro from './src/pages/cadastro';
import Inicio from './src/pages/inicio';
import Login from './src/pages/login';
import { theme } from './src/global/themes';

/**
 * Decide qual tela mostrar a partir da sessao guardada no banco.
 * A troca entre login e cadastro continua em estado local; quando o app crescer,
 * este e o ponto para entrar um navegador de rotas de verdade.
 */
function Rotas() {
    const { carregando, erroBanco, usuario } = useAuth();
    const [telaPublica, setTelaPublica] = React.useState<'login' | 'cadastro'>('login');

    if (carregando) {
        return (
            <View style={styles.centralizado}>
                <ActivityIndicator size="large" color={theme.colors.botao} />
            </View>
        );
    }

    if (erroBanco) {
        return (
            <View style={styles.centralizado}>
                <Text style={styles.erro}>{erroBanco}</Text>
            </View>
        );
    }

    if (usuario) {
        return <Inicio />;
    }

    return telaPublica === 'login' ? (
        <Login onCadastroPress={() => setTelaPublica('cadastro')} />
    ) : (
        <Cadastro onLoginPress={() => setTelaPublica('login')} />
    );
}

export default function App() {
    return (
        <AuthProvider>
            <View style={styles.container}>
                <Rotas />
                <StatusBar style="auto" />
            </View>
        </AuthProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    centralizado: {
        flex: 1,
        backgroundColor: theme.colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    erro: {
        color: theme.colors.erro,
        fontSize: 15,
        textAlign: 'center',
    },
});
