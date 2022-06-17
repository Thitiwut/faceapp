import React, {useEffect, useRef, useState} from 'react';
import {Platform, Text, TouchableOpacity, View, ScrollView} from 'react-native';
import RtcEngine, {
  RtcLocalView,
  RtcRemoteView,
  VideoRenderMode,
  ClientRole,
  ChannelProfile,
} from 'react-native-agora';
import requestCameraAndAudioPermission from './components/Permission';
import styles from './components/style';

const token = null;
const appId = '66fd6e3fb0b14fc48b55e455992b9568';
const channelName = 'channel-x';

export default function App() {
  const [isHost, setIsHost] = useState(true);
  const [joinSucceed, setJoined] = useState(false);
  const [peerIds, setPeerIds] = useState([]);

  const AgoraEngine = useRef();

  useEffect(() => {
    if (Platform.OS === 'android') {
      requestCameraAndAudioPermission().then(() => {
        console.log('request');
      });
    }

    let init = async () => {
      AgoraEngine.current = await RtcEngine.create(appId);
      AgoraEngine.current.enableVideo();
      AgoraEngine.current.setChannelProfile(ChannelProfile.LiveBroadcasting);

      AgoraEngine.current.setClientRole(
        isHost ? ClientRole.Broadcaster : ClientRole.Audience,
      );

      AgoraEngine.current.addListener('UserJoined', (uid, reason) => {
        console.log('UserJoined', uid, reason);
        setPeerIds(peerIds.filter(id => id !== uid));
      });

      AgoraEngine.current.addListener('UserOffline', (uid, elapsed) => {
        console.log('JoinChannelSuccess', uid, elapsed);
        if (peerIds.indexOf(uid) === -1) {
          setPeerIds([...peerIds, uid]);
        }
      });

      AgoraEngine.current.addListener(
        'JoinChannelSuccess',
        (channelId, uid, elapsed) => {
          console.log('JoinChannelSuccess', channelId, uid, elapsed);
          setJoined(true);
        },
      );
    };
    init();
  }, [isHost, joinSucceed, peerIds]);

  const onSwitchCamera = () => AgoraEngine.current.switchCamera();

  const toggleRoll = async () => {
    setIsHost(!isHost);
    async () => {
      await AgoraEngine.current.setClientRole(
        isHost ? ClientRole.Broadcaster : ClientRole.Audience,
      );
    };
  };

  const startCall = async () => {
    await AgoraEngine.current.joinChannel(token, channelName, null, 0);
  };

  const endCall = async () => {
    await AgoraEngine.current.leaveChannel();
    setPeerIds([]);
    setJoined(false);
  };

  const _renderVideos = () => {
    return joinSucceed ? (
      <View style={styles.fullView}>
        {isHost ? (
          <RtcLocalView.SurfaceView
            style={styles.max}
            channelId={channelName}
            renderMode={VideoRenderMode.Hidden}
          />
        ) : (
          <></>
        )}
        {_renderRemoteVideos()}
      </View>
    ) : null;
  };

  const _renderRemoteVideos = () => {
    return (
      <ScrollView
        style={styles.remoteContainer}
        contentContainerStyle={styles.remoteContainerContent}
        horizontal={true}>
        {peerIds.map(value => {
          return (
            <RtcRemoteView.SurfaceView
              style={styles.remote}
              uid={value}
              channelId={channelName}
              renderMode={VideoRenderMode.Hidden}
              zOrderMediaOverlay={true}
            />
          );
        })}
      </ScrollView>
    );
  };

  return (
    <View style={styles.max}>
      <View style={styles.max}>
        <Text style={styles.roleText}>filter test</Text>
        <Text style={styles.roleText}>
          You're {isHost ? 'a broadcaster' : 'the audience'}
        </Text>
        <View style={styles.buttonHolder}>
          <TouchableOpacity onPress={toggleRoll} style={styles.button}>
            <Text style={styles.buttonText}> Toggle Role </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={startCall} style={styles.button}>
            <Text style={styles.buttonText}> Start Call </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={endCall} style={styles.button}>
            <Text style={styles.buttonText}> End Call </Text>
          </TouchableOpacity>
        </View>
        {_renderVideos()}
      </View>
    </View>
  );
}
