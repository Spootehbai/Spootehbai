import { useState } from "react";

import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { router } from "expo-router";
import { useAuth } from "../data/AuthContext";


export default function LoginScreen(){
const { loginAccount } = useAuth();

const [email,setEmail] = useState("");

const [password,setPassword] = useState("");

const [isLoggingIn,setIsLoggingIn] = useState(false);



async function login(){
  setIsLoggingIn(true);
  try {
    await loginAccount(email, password);
    router.replace("/home");
  } catch (error) {
    Alert.alert(
      "Login Failed",
      error instanceof Error ? error.message : "Could not log in."
    );
  } finally {
    setIsLoggingIn(false);
  }
}



return(

<View style={styles.container}>


<Image

source={require("../assets/spootehbai-logo.jpg")}

style={styles.logo}

/>



<Text style={styles.title}>
Spootehbai
</Text>


<Text style={styles.subtitle}>
Log in to your account
</Text>



<TextInput

placeholder="Email"

placeholderTextColor="#9CA3AF"

value={email}

onChangeText={setEmail}

autoCapitalize="none"

keyboardType="email-address"

style={styles.input}

/>



<TextInput

placeholder="Password"

placeholderTextColor="#9CA3AF"

secureTextEntry

value={password}

onChangeText={setPassword}

style={styles.input}

/>



<TouchableOpacity

style={styles.button}

onPress={login}

disabled={isLoggingIn}

>


<Text style={styles.buttonText}>
{isLoggingIn ? "Logging in..." : "Log In"}
</Text>


</TouchableOpacity>




<TouchableOpacity onPress={()=>router.push("/reset-password")}>
  <Text style={styles.forgot}>Forgot password?</Text>
</TouchableOpacity>



<TouchableOpacity

onPress={()=>router.replace("/register")}

>


<Text style={styles.link}>
Don't have an account? Register
</Text>


</TouchableOpacity>



</View>

);

}



const styles = StyleSheet.create({

container:{

flex:1,

backgroundColor:"#000",

alignItems:"center",

justifyContent:"center",

paddingHorizontal:18,

},


logo:{

width:95,

height:95,

borderRadius:50,

marginBottom:25,

},


title:{

color:"#fff",

fontSize:32,

fontWeight:"900",

},


subtitle:{

color:"#fff",

fontSize:14,

marginBottom:25,

},


input:{

width:"100%",

height:55,

backgroundColor:"#343A40",

borderRadius:8,

paddingHorizontal:15,

color:"#fff",

marginBottom:12,

},


button:{

width:"100%",

height:50,

backgroundColor:"#00FF66",

borderRadius:8,

alignItems:"center",

justifyContent:"center",

marginTop:5,

},


buttonText:{

color:"#000",

fontSize:16,

fontWeight:"800",

},


forgot:{

color:"#00FF66",

marginTop:18,

fontSize:14,

},


link:{

color:"#00FF66",

marginTop:20,

fontSize:14,

fontWeight:"600",

},

});