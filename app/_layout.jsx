import { Stack } from "expo-router";
import { MusicProvider } from "../context/MusicContext";


export default function RootLayout(){
return (
<MusicProvider>
<Stack

screenOptions={{
headerShown:false,
}}

>


<Stack.Screen 
name="index"
/>


<Stack.Screen 
name="login"
/>


<Stack.Screen 
name="register"
/>


<Stack.Screen 
name="home"
/>


<Stack.Screen 
name="details/[id]"
/>
<Stack.Screen name="queue" />
</Stack>
</MusicProvider>
);

}