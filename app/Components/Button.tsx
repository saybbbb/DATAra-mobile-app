import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Button({
  title,
  onPress,
}: {
  title: string;
  onPress: () => void;
  children?: React.ReactNode;
}) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <View style={styles.content}>
      <Text style={styles.text}>
        {title}
      </Text>
      <MaterialIcons name="arrow-forward" size={18} color="white" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#135bec",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    alignItems: "center",
  },
  content: {  
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  text: {
    color: "#fff",
    fontFamily: "SpaceGrotesk",
    fontWeight: "medium",
    textAlign: "center",
  },
});
