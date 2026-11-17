import { router } from "expo-router";

import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AppButton } from "../components/AppButton.jsx";

import {
  colors,
  spacing,
  radius,
} from "../constants/theme";


export default function WelcomeScreen(){


return (

<View style={styles.container}>


<View style={styles.content}>


<View style={styles.logo}>

<Text style={styles.logoText}>
♪
</Text>

</View>



<Text style={styles.title}>
Playlist sa mga Bai
</Text>



<Text style={styles.subtitle}>
Bali e diskubre lang imong mga paborito nga kanta.
</Text>



<AppButton

title="Sugdi Na"

onPress={() => router.replace("/login")}

/>


</View>



<Text style={styles.footer}>
Music Playlist App
</Text>


</View>

);

}



const styles = StyleSheet.create({

container:{

flex:1,

backgroundColor:"#000000",

justifyContent:"space-between",

padding:spacing.xl,

},


content:{

flex:1,

justifyContent:"center",

alignItems:"center",

},


logo:{

width:84,

height:84,

borderRadius:radius.xl,

backgroundColor:"#00FF66",

justifyContent:"center",

alignItems:"center",

marginBottom:spacing.lg,

},


logoText:{

color:"#000000",

fontSize:42,

fontWeight:"800",

},


title:{

color:"#FFFFFF",

fontSize:34,

fontWeight:"800",

marginBottom:spacing.sm,

},


subtitle:{

color:"#AAAAAA",

fontSize:16,

lineHeight:24,

textAlign:"center",

maxWidth:320,

marginBottom:spacing.xl,

},


footer:{

color:"#777777",

textAlign:"center",

},

});