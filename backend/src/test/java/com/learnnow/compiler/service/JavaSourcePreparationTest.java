package com.learnnow.compiler.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

/**
 * Judge0 compiles Java as Main.java and runs {@code java Main}. Lesson snippets name their own
 * classes, so each has to be fitted to that without changing what it does - renaming the class used
 * to break any snippet that referred to its own name.
 */
class JavaSourcePreparationTest {

    private static String prepare(String code) {
        return CompilerSnippetService.prepareJavaSourceCode(code);
    }

    @Test
    void aClassThatRefersToItselfKeepsItsNameAndMainCallsIt() {
        String out =
                prepare(
                        """
                        public class Account {
                            public static void main(String[] args) {
                                System.out.println(new Account());
                            }
                        }\
                        """);

        assertThat(out).contains("class Account {").doesNotContain("public class Account");
        assertThat(out).contains("new Account()");
        assertThat(out).contains("public class Main {").contains("Account.main(args);");
    }

    @Test
    void mainInANonPublicClassIsCalledFromMain() {
        String out =
                prepare(
                        """
                        record Point(int x, int y) {}

                        class Demo {
                            public static void main(String[] args) {
                                System.out.println(new Point(1, 2));
                            }
                        }\
                        """);

        assertThat(out).contains("Demo.main(args);").contains("record Point(int x, int y) {}");
    }

    @Test
    void aSnippetAlreadyCalledMainIsLeftAsItIs() {
        String code =
                """
                public class Main {
                    public static void main(String[] args) {}
                }\
                """;

        assertThat(prepare(code)).contains("class Main {").doesNotContain(".main(args);");
    }

    @Test
    void nestedPublicTypesAreNotTouched() {
        String out =
                prepare(
                        """
                        public class Shop {
                            public static class Item {}
                            public static void main(String[] args) {}
                        }\
                        """);

        assertThat(out).contains("    public static class Item {}").contains("Shop.main(args);");
    }

    @Test
    void bareStatementsAreWrappedInMain() {
        assertThat(prepare("System.out.println(1 + 1);"))
                .startsWith("public class Main {")
                .contains("System.out.println(1 + 1);");
    }
}
