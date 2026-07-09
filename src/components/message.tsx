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
            {!isOwn && (<Text style={styles.author}>{author}</Text>)}
            <Text style={styles.text}>{text}</Text>
            <Text style={styles.time} numberOfLines={1}>{time}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        padding: 12,
        maxWidth: '75%',
        minWidth: 90,
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
        alignSelf: 'flex-end',
        marginRight: 4,
        minWidth: 40,
        textAlign: 'right',
    },
     ownMessage: {
    alignSelf: 'flex-end',
    },
    otherMessage: {
        alignSelf: 'flex-start',
    },
});