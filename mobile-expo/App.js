import React from 'react';
import { View, Text, Button, Linking, StyleSheet } from 'react-native';
export default function App(){ const url = 'https://YOUR_PC_IP:3443'; return (<View style={styles.container}><Text style={styles.title}>Pontus Mobile (Web NFC)</Text><Text style={{marginBottom:12}}>This app opens the Web NFC page in your browser where the NFC reading occurs.</Text><Button title="Abrir Leitor NFC" onPress={()=>Linking.openURL(url)} /></View> );}
const styles = StyleSheet.create({container:{flex:1,alignItems:'center',justifyContent:'center',padding:20},title:{fontSize:20,fontWeight:'700',marginBottom:8}});
