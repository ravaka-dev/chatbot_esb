import {useEffect} from "react";
import type {UIMessage} from "ai";

function loadMessages(storageKey: string): UIMessage[] {
    try {
        const raw = window.localStorage.getItem(storageKey)
        const parsed = raw ? (JSON.parse(raw) as UIMessage[]) : []
        return Array.isArray(parsed) ? parsed : []
    }catch{
        return []
    }
}

export function useChatPersistence (storageKey: string , messages: UIMessage[] , setMessages: (messages: UIMessage[])=>void){
    useEffect(()=>{
        const saved = loadMessages(storageKey);
        if(saved.length > 0) setMessages(saved)
    },[])

    useEffect(()=> {
        try{
            window.localStorage.setItem(storageKey, JSON.stringify(messages));
        }catch(e){
            console.error("Echec de la sauvegarde des messages en localStorage",e)
        }
    },[messages,storageKey])

    const clear = () => {
        try {
            window.localStorage.removeItem(storageKey);
        }catch(e){
            console.error("Echec de la suppression des messages en localStorage",e)
        }
    }

    return {clear}
}