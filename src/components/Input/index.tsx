import React, { forwardRef, useState } from 'react';
import {
    StyleProp,
    Text,
    TextInput,
    TextInputProps,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import {
    mdiAccountOutline,
    mdiEmailOutline,
    mdiEyeOffOutline,
    mdiEyeOutline,
    mdiFileDocumentOutline,
    mdiLockOutline,
} from '@mdi/js';

import { styles } from './styles';
import { theme } from '../../global/themes';

const iconPaths = {
    'account-outline': mdiAccountOutline,
    'file-document-outline': mdiFileDocumentOutline,
    'email-outline': mdiEmailOutline,
    'lock-outline': mdiLockOutline,
    'eye-outline': mdiEyeOutline,
    'eye-off-outline': mdiEyeOffOutline,
};

type IconName = keyof typeof iconPaths;

function MdiIcon({ name, color }: { name: IconName; color: string }) {
    return (
        <Svg width={20} height={20} viewBox="0 0 24 24">
            <Path d={iconPaths[name]} fill={color} />
        </Svg>
    );
}

type Props = TextInputProps & {
    style?: StyleProp<ViewStyle>;
    iconLeftName?: IconName;
    iconRightName?: IconName;
    iconLeftPress?: () => void;
    iconRightPress?: () => void;
    /** Mensagem de validacao exibida abaixo do campo; tambem pinta a borda. */
    erro?: string | null;
};

export const Input = forwardRef<TextInput, Props>((props, ref) => {
    const {
        iconLeftName,
        iconRightName,
        iconLeftPress,
        iconRightPress,
        placeholderTextColor,
        style,
        erro,
        ...rest
    } = props;
    const [isFocused, setIsFocused] = useState(false);

    const corDoIcone = erro ? theme.colors.erro : theme.colors.cinza;

    return (
        <View style={styles.wrapper}>
            <View
                style={[
                    styles.container,
                    isFocused && styles.containerFocado,
                    erro ? styles.containerComErro : null,
                    style,
                ]}
            >
                {iconLeftName &&
                    (iconLeftPress ? (
                        <TouchableOpacity onPress={iconLeftPress} hitSlop={8}>
                            <MdiIcon name={iconLeftName} color={corDoIcone} />
                        </TouchableOpacity>
                    ) : (
                        <MdiIcon name={iconLeftName} color={corDoIcone} />
                    ))}

                <TextInput
                    ref={ref}
                    style={styles.input}
                    placeholderTextColor={placeholderTextColor ?? theme.colors.cinza}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    {...rest}
                />

                {iconRightName &&
                    (iconRightPress ? (
                        <TouchableOpacity onPress={iconRightPress} hitSlop={8}>
                            <MdiIcon name={iconRightName} color={corDoIcone} />
                        </TouchableOpacity>
                    ) : (
                        <MdiIcon name={iconRightName} color={corDoIcone} />
                    ))}
            </View>

            {erro ? <Text style={styles.erro}>{erro}</Text> : null}
        </View>
    );
});

Input.displayName = 'Input';

export default Input;
