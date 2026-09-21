import { StyleSheet } from 'react-native';

import { theme } from '../../global/themes';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    card: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 28,
    },
    saudacao: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.titulo,
    },
    subtitulo: {
        marginTop: 4,
        color: theme.colors.links,
    },
    dados: {
        marginTop: 24,
    },
    rotulo: {
        fontSize: 12,
        color: theme.colors.links,
        marginTop: 12,
    },
    valor: {
        fontSize: 16,
        color: theme.colors.titulo,
    },
    botao: {
        marginTop: 28,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 50,
        backgroundColor: theme.colors.botao,
        borderRadius: 50,
    },
    botaoDesabilitado: {
        backgroundColor: theme.colors.botaoDesabilitado,
    },
    botaoTexto: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
