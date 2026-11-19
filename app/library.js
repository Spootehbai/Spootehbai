import React from "react";
import { router } from "expo-router";
import LibraryScreen from "../src/LibraryScreen";

export default function LibraryRoute() {
    const handleOpenItem = (item) => {
        if (
            item.type === "Song" ||
            item.type === "Recently played"
        ) {
            router.push({
                pathname: "/details/[id]",
                params: {
                    id: String(item.id),
                },
            });
        }
    };

    return ( <
        LibraryScreen onOpenItem = { handleOpenItem }
        />
    );
}