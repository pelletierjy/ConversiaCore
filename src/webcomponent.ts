import widgetCss from "./styles.css?inline";
import { renderStudentFlow } from "./ui/app";
import { renderChatView } from "./ui/chat/chat-view";
import { setLocale, isSupportedLocale } from "./i18n/locale";
import type { StudentSession } from "./models/types";

const OBSERVED_ATTRIBUTES = [
  "theme",
  "lang",
  "subject",
  "grade-level",
  "context",
  "gemini-api-key",
  "groq-api-key",
  "openrouter-api-key",
  "firebase-config",
] as const;

/**
 * `<need-homework-app>` — the AI homework chatbot as a self-contained custom element.
 *
 * Attributes:
 *  - `theme`: "light" | "dark" (updates live, no re-render).
 *  - `lang`: "en" | "fr" | "es" (re-renders the current step in place; keeps the session).
 *  - `subject` / `grade-level`: forces the subject/grade and skips the picker.
 *    Changing either restarts the flow with a new session.
 *  - `context`: the host app's execution-context key (e.g. "ScalesViewer"), independent of subject/grade.
 *    Changing it restarts the flow with a new session.
 *  - `gemini-api-key` / `groq-api-key` / `openrouter-api-key`: runtime API keys.
 *  - `firebase-config`: JSON string with Firebase config object.
 */
class NeedHomeworkApp extends HTMLElement {
  static get observedAttributes(): readonly string[] {
    return OBSERVED_ATTRIBUTES;
  }

  #appRoot: HTMLElement | null = null;
  #session: StudentSession | null = null;

  connectedCallback(): void {
    if (this.#appRoot) return;

    const shadow = this.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = widgetCss;
    shadow.appendChild(style);

    this.#appRoot = document.createElement("div");
    this.#appRoot.id = "app";
    shadow.appendChild(this.#appRoot);

    this.#applyTheme();
    this.#syncConfig();
    setLocale(this.#readLocale());
    void this.#render();
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null
  ): void {
    if (!this.#appRoot || oldValue === newValue) return;

    if (name === "theme") {
      this.#applyTheme();
      return;
    }
    if (name === "lang") {
      setLocale(this.#readLocale());
      void this.#render();
      return;
    }
    if (
      name === "gemini-api-key" ||
      name === "groq-api-key" ||
      name === "openrouter-api-key" ||
      name === "firebase-config"
    ) {
      this.#syncConfig();
      return;
    }
    // subject / grade-level / context changed: start over with a new session.
    this.#session = null;
    void this.#render();
  }

  #applyTheme(): void {
    if (this.getAttribute("theme") === "dark") {
      this.setAttribute("data-theme", "dark");
    } else {
      this.removeAttribute("data-theme");
    }
  }

  #readLocale(): "en" | "fr" | "es" {
    const lang = this.getAttribute("lang");
    return isSupportedLocale(lang) ? lang : "en";
  }

  #syncConfig(): void {
    const firebaseAttr = this.getAttribute("firebase-config");
    window.__NEED_HOMEWORK_CONFIG__ = {
      geminiApiKey: this.getAttribute("gemini-api-key") || undefined,
      groqApiKey: this.getAttribute("groq-api-key") || undefined,
      openrouterApiKey: this.getAttribute("openrouter-api-key") || undefined,
      firebaseConfig: firebaseAttr ? JSON.parse(firebaseAttr) : undefined,
    };
  }

  async #render(): Promise<void> {
    const root = this.#appRoot;
    if (!root) return;

    if (this.#session) {
      await renderChatView(root, this.#session);
      return;
    }

    const gradeLevelAttr = this.getAttribute("grade-level");
    await renderStudentFlow(root, {
      forcedSubject: this.getAttribute("subject") ?? undefined,
      forcedGradeLevel:
        gradeLevelAttr != null ? Number(gradeLevelAttr) : undefined,
      forcedContextKey: this.getAttribute("context") ?? undefined,
      onSessionStart: (session) => {
        this.#session = session;
      },
    });
  }
}

if (!customElements.get("need-homework-app")) {
  customElements.define("need-homework-app", NeedHomeworkApp);
}
