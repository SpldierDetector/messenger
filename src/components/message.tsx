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
            <Text style={[styles.time, 
                isOwn ? styles.ownTime : styles.otherTime,]} numberOfLines={1}>
                    {time}
            </Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        padding: 12,
        maxWidth: '75%',
        minWidth: 90,
        borderRadius: 18,
        marginBottom: 8,
    },
    author: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 4,
    },
    text: {
        color: 'white',
    },
    time: {
        fontSize: 12,
        alignSelf: 'flex-end',
        marginRight: 4,
        width: 50,
        textAlign: 'right',
    },
    ownTime: {
        color: 'rgba(255, 255, 255, 0.6)',
    },
    otherTime: {
        color: 'gray',
    },
    ownMessage: {
        alignSelf: 'flex-end',
        backgroundColor: '#2563eb',
        borderBottomRightRadius: 3,
    },
    otherMessage: {
        alignSelf: 'flex-start',
        backgroundColor: '#27272a',
        borderBottomLeftRadius: 3,
    },
});