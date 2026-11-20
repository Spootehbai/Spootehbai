import { Stack } from "expo-router";
import { AuthProvider } from "../data/AuthContext";

export default function RootLayout(){

return (

<AuthProvider>
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

<Stack.Screen
name="playlists/[id]"
/>

<Stack.Screen
name="reset-password"
/>

<Stack.Screen
name="change-password"
/>

<Stack.Screen
name="delete-account"
/>



</Stack>
</AuthProvider>

);

}