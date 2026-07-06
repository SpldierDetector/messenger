import { StyleSheet, Text, View } from 'react-native';

type MessageProps = {
    author: string;
    text: string;
}

export function Message(props: MessageProps) {
    return (
        <View style={styles.container}>
            <Text style={styles.author}>{props.author}</Text>
            <Text style={styles.text}>{props.text}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        padding: 12,
    },
    author: {
        fontWeight: 'bold',
        color: 'white',
    },
    text: {
        color: 'white',
    },
});