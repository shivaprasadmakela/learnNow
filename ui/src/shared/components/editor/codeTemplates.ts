export interface LanguageOption {
    id: string;
    name: string;
    badgeLabel: string;
    monacoLanguage: string;
    extension: string;
    iconClass: string;
    defaultCode: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
    {
        id: 'javascript',
        name: 'JavaScript',
        badgeLabel: 'JS',
        monacoLanguage: 'javascript',
        extension: 'main.js',
        iconClass: 'fa-brands fa-js',
        defaultCode: `// 🚀 Welcome to JavaScript Sandbox!
// "It works on my machine" is now "It works in your browser!"

function startCoding() {
    const bugs = 0;
    const needCoffee = true;

    console.log("🚀 Welcome to learnNow JS Playground!");
    console.log(\`Bugs found: \${bugs} | Need Coffee: \${needCoffee ? "YES ☕" : "No"}\`);
    console.log("Ready to turn caffeine into code!");
}

startCoding();
`
    },
    {
        id: 'typescript',
        name: 'TypeScript',
        badgeLabel: 'TS',
        monacoLanguage: 'typescript',
        extension: 'main.ts',
        iconClass: 'fa-brands fa-js',
        defaultCode: `// 🛡️ Welcome to TypeScript Playground!
// Where "any" is a bad word and compiler errors save your life.

interface Programmer {
    name: string;
    favoriteLanguage: string;
    bugsFixedToday: number;
}

const coder: Programmer = {
    name: "Future Tech Titan 🌟",
    favoriteLanguage: "TypeScript",
    bugsFixedToday: 99
};

console.log(\`👋 Welcome \${coder.name}!\`);
console.log(\`Types checked! Happy coding in \${coder.favoriteLanguage}!\`);
`
    },
    {
        id: 'python',
        name: 'Python',
        badgeLabel: 'Py',
        monacoLanguage: 'python',
        extension: 'main.py',
        iconClass: 'fa-brands fa-python',
        defaultCode: `# 🐍 Welcome to Python Sandbox!

def main():
    motto = "Life is short, use Python!"
    print("🐍 Welcome to learnNow Python Playground!")
    print(f"💡 Quote of the day: '{motto}'")
    print("Zero semicolons were harmed in the making of this code. 😂")

main()
`
    },
    {
        id: 'html',
        name: 'HTML5 & CSS',
        badgeLabel: 'HTML',
        monacoLanguage: 'html',
        extension: 'index.html',
        iconClass: 'fa-brands fa-html5',
        defaultCode: `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', sans-serif; background: #0f172a; color: #38bdf8; text-align: center; padding: 40px; }
        .card { background: #1e293b; border: 2px dashed #38bdf8; border-radius: 12px; padding: 24px; display: inline-block; }
        h1 { margin: 0 0 10px 0; color: #f43f5e; }
        p { color: #cbd5e1; font-size: 1.1rem; }
    </style>
</head>
<body>
    <div class="card">
        <h1>🎉 Welcome to HTML/CSS Sandbox!</h1>
        <p>Centering a <code>&lt;div&gt;</code> has never been easier. 🚀</p>
        <p>Edit me and watch magic happen live!</p>
    </div>
</body>
</html>
`
    },
    {
        id: 'java',
        name: 'Java',
        badgeLabel: 'Java',
        monacoLanguage: 'java',
        extension: 'Main.java',
        iconClass: 'fa-brands fa-java',
        defaultCode: `public class Main {
    public static void main(String[] args) {
        System.out.println("☕ Welcome to Java Sandbox!");
        System.out.println("Public static void main... because 4 words are better than 1! 😂");
        System.out.println("System.out.println('Happy Coding!');");
    }
}
`
    },
    {
        id: 'cpp',
        name: 'C++',
        badgeLabel: 'C++',
        monacoLanguage: 'cpp',
        extension: 'main.cpp',
        iconClass: 'fa-solid fa-code',
        defaultCode: `#include <iostream>

int main() {
    std::cout << "⚡ Welcome to C++ Playground!" << std::endl;
    std::cout << "Pointers, memory management, and speed! 🏎️" << std::endl;
    std::cout << "No segmentation faults allowed here today! 😉" << std::endl;
    return 0;
}
`
    },
    {
        id: 'c',
        name: 'C',
        badgeLabel: 'C',
        monacoLanguage: 'c',
        extension: 'main.c',
        iconClass: 'fa-solid fa-code',
        defaultCode: `#include <stdio.h>

int main() {
    printf("💻 Welcome to C Sandbox!\\n");
    printf("The mother of all languages. Respect the semicolon! 🫡\\n");
    printf("printf(\\"Hello, World!\\"); is where it all began.\\n");
    return 0;
}
`
    },
    {
        id: 'csharp',
        name: 'C#',
        badgeLabel: 'C#',
        monacoLanguage: 'csharp',
        extension: 'Program.cs',
        iconClass: 'fa-solid fa-code',
        defaultCode: `using System;

class Program {
    static void Main() {
        Console.WriteLine("✨ Welcome to C# Sandbox!");
        Console.WriteLine("Powered by .NET and pure sharp logic! 🎯");
        Console.WriteLine("Console.WriteLine('Let\u2019s build something epic!');");
    }
}
`
    },
    {
        id: 'go',
        name: 'Go',
        badgeLabel: 'Go',
        monacoLanguage: 'go',
        extension: 'main.go',
        iconClass: 'fa-brands fa-golang',
        defaultCode: `package main

import "fmt"

func main() {
    fmt.Println("🦫 Welcome to Go Playground!")
    fmt.Println("Concurrency made simple, binaries made fast!")
    fmt.Println("Goroutines are spinning up for your code... 🚀")
}
`
    },
    {
        id: 'kotlin',
        name: 'Kotlin',
        badgeLabel: 'Kotlin',
        monacoLanguage: 'kotlin',
        extension: 'main.kt',
        iconClass: 'fa-solid fa-code',
        defaultCode: `fun main() {
    println("🎯 Welcome to Kotlin Playground!")
    println("Null safety built-in! Say goodbye to NullPointerException! 🎉")
    println("Concise, powerful, and fun to write.")
}
`
    },
    {
        id: 'php',
        name: 'PHP',
        badgeLabel: 'PHP',
        monacoLanguage: 'php',
        extension: 'index.php',
        iconClass: 'fa-brands fa-php',
        defaultCode: `<?php
echo "🐘 Welcome to PHP Sandbox!\n";
echo "Powering 75%+ of the web since 1995! 🌐\n";
echo "echo 'Hello, Happy Developer!';\n";
?>
`
    }
];
