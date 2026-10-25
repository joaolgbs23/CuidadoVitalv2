import { StyleSheet } from 'react-native';

import { theme } from '../../global/themes';

/**
 * Estilos do proprio componente de entrada.
 * Antes o componente importava os estilos da tela de login, o que amarrava um
 * componente reutilizavel a uma tela especifica.
 */
export const styles = StyleSheet.create({
    container: {
        width: '100%',
        minWidth: 0,
        flexShrink: 0,
        flexDirection: 'row',
        alignItems: 'center',
        height: 48,
        borderWidth: 2,
        borderColor: theme.colors.cinza,
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 0,
        marginBottom: 16,
    },
    containerFocado: {
        borderColor: theme.colors.botao,
    },
    containerComErro: {
        borderColor: theme.colors.erro,
    },
    input: {
        flex: 1,
        height: 44,
        marginHorizontal: 8,
        paddingVertical: 0,
        paddingHorizontal: 0,
        minWidth: 0,
        minHeight: 0,
        color: theme.colors.titulo,
        fontSize: 16,
        lineHeight: 22,
        textAlignVertical: 'center',
        includeFontPadding: false,
        backgroundColor: 'transparent',
    },
    wrapper: {
        width: '100%',
    },
    erro: {
        color: theme.colors.erro,
        fontSize: 12,
        marginTop: -12,
        marginBottom: 12,
        alignSelf: 'flex-start',
    },
});
