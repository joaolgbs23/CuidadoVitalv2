import { Dimensions, StyleSheet } from 'react-native';

import { theme } from '../../global/themes';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollContent: {
        flexGrow: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 24,
        paddingHorizontal: 16,
    },
    logoContainer: {
        height: Dimensions.get('window').height / 3,
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    logoText: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 4,
        color: theme.colors.titulo,
    },
    box: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        borderRadius: 20,
        marginBottom: 40,
    },
    boxImage: {
        width: 210,
        height: 210,
    },
    esqueceuSenha: {
        color: theme.colors.links,
        marginBottom: 10,
        alignSelf: 'flex-end',
    },
    erro: {
        color: theme.colors.erro,
        fontSize: 13,
        textAlign: 'center',
        marginTop: 4,
    },
    button: {
        width: '100%',
        marginTop: 20,
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 52,
        backgroundColor: theme.colors.botao,
        borderRadius: 50,
    },
    buttonDisabled: {
        backgroundColor: theme.colors.botaoDesabilitado,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    link: {
        color: theme.colors.links,
        marginTop: 12,
        textAlign: 'center',
    },
    linkForte: {
        fontWeight: 'bold',
        color: theme.colors.links,
    },
});
