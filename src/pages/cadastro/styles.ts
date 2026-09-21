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
    boxImage: {
        width: 210,
        height: 210,
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
        padding: 28,
        borderRadius: 20,
        marginBottom: 30,
    },
    checkboxRow: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    checkbox: {
        width: 28,
        height: 28,
        borderWidth: 2,
        borderColor: theme.colors.cinza,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    checkboxChecked: {
        backgroundColor: theme.colors.botao,
        borderColor: theme.colors.botao,
    },
    checkmark: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    terms: {
        color: theme.colors.titulo,
        fontSize: 13,
        flexShrink: 1,
    },
    termsLink: {
        color: theme.colors.links,
        fontWeight: 'bold',
    },
    erro: {
        color: theme.colors.erro,
        fontSize: 13,
        textAlign: 'center',
        marginTop: 10,
    },
    button: {
        width: '100%',
        marginTop: 24,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 50,
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
    loginText: {
        color: theme.colors.titulo,
        marginTop: 12,
    },
    loginLink: {
        color: theme.colors.links,
        fontWeight: 'bold',
    },
});
