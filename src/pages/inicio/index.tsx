import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { useAuth } from '../../contexts/AuthContext';
import { formatarCpf } from '../../utils/validacao';
import { styles } from './styles';

/**
 * Tela exibida apos o login. Hoje ela so confirma quem esta autenticado e
 * permite sair; e o ponto onde as telas de acompanhamento de saude entram.
 */
export default function Inicio() {
    const { usuario, fazerLogout } = useAuth();
    const [saindo, setSaindo] = useState(false);

    if (!usuario) {
        return null;
    }

    const primeiroNome = usuario.nome.split(' ')[0];

    async function aoSair() {
        setSaindo(true);
        try {
            await fazerLogout();
        } finally {
            setSaindo(false);
        }
    }

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.saudacao}>Olá, {primeiroNome}</Text>
                <Text style={styles.subtitulo}>Você está conectado ao CuidadoVital.</Text>

                <View style={styles.dados}>
                    <Text style={styles.rotulo}>Nome</Text>
                    <Text style={styles.valor}>{usuario.nome}</Text>

                    <Text style={styles.rotulo}>E-mail</Text>
                    <Text style={styles.valor}>{usuario.email}</Text>

                    <Text style={styles.rotulo}>CPF</Text>
                    <Text style={styles.valor}>{formatarCpf(usuario.cpf)}</Text>
                </View>

                <Pressable
                    style={[styles.botao, saindo && styles.botaoDesabilitado]}
                    onPress={aoSair}
                    disabled={saindo}
                    accessibilityRole="button"
                >
                    {saindo ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.botaoTexto}>Sair</Text>
                    )}
                </Pressable>
            </View>
        </View>
    );
}
