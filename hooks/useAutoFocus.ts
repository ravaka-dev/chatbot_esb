import {useCallback,useEffect , useRef} from "react";

type ChatStatus = "submitted" | "streaming" | "ready" | "error";

export function useAutoFocus(open: boolean , status: ChatStatus){
    const textareaRef = useRef<HTMLTextAreaElement | null >(null);

    const focusInput = useCallback(()=> {
        window.setTimeout(()=> textareaRef.current?.focus(),80)
    },[])

    useEffect (()=>{
        if(open)focusInput()
    },[open,focusInput])

    useEffect(()=>{
        if(status === "ready" && open) focusInput()
    },[status,open,focusInput])

    return {textareaRef , focusInput}
}