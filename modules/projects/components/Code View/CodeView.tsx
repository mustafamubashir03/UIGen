import Prism from "prismjs";
import { useEffect } from "react";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-python";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-javascript";
import "./CodeTheme.css";

const CodeView = ({code,lang="typescript"}:{code:string, lang:string}) => {
  useEffect(()=>{
    if(code && lang ){
      Prism.highlightAll()
    }
  },[code,lang])
  return (
    <pre className="p-2 bg-transparent border-none rounded-lg m-0 text-xs overflow-x-auto">
      <code className={`language-${lang}`}>{code}</code>
    </pre>
  )
}

export default CodeView