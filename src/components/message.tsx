import { StyleSheet, Text, View } from 'react-native';

type MessageProps = {
    author: string;
    text: string;
    time: string;
    isOwn: boolean;
};

export function Message({author, text, time, isOwn}: MessageProps) {
    return (
        <View style={[styles.container, isOwn ? styles.ownMessage : styles.otherMessage,]}>
            <Text style={styles.author}>{author}</Text>
            <Text style={styles.text}>{text}</Text>
            <Text style={styles.time}>{time}</Text>
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
    time: {
        color: 'gray',
        fontSize: 12,
        textAlign: 'right'
    },
     ownMessage: {
    alignSelf: 'flex-end',
    },
    otherMessage: {
        alignSelf: 'flex-start',
    },
});