import { getLocale } from './locale';

export type Locale = 'en' | 'fr' | 'es';

interface TranslationDict {
  common: {
    grade: string;
  };
  selector: {
    title: string;
    subtitle: string;
    gradeLevelLabel: string;
    subjectLabel: string;
    subjectForcedLabel: string;
    subjectOtherOption: string;
    subjectPlaceholder: string;
    startButton: string;
  };
  chat: {
    thinking: string;
    inputPlaceholder: string;
    sendButton: string;
    errorNotConfigured: string;
    errorUnauthorized: string;
    errorRateLimited: string;
    errorUnavailable: string;
    errorNetwork: string;
    errorGeneric: string;
    aiProviderWarning: string;
    providerLabel: string;
    modelLabel: string;
    welcomeMessage: string;
  };
  guardrails: {
    redirectMessage: string;
  };
  admin: {
    firebaseNotConfiguredTitle: string;
    firebaseNotConfiguredDescription: string;
    firebaseStep1: string;
    firebaseStep2: string;
    firebaseStep3: string;
    firebaseStep4: string;
    dbErrorTitle: string;
    dbErrorDescription: string;
    knowledgeBaseNavLabel: string;
    settingsNavLabel: string;
    knowledgeBaseTitle: string;
    addEntryButton: string;
    settingsTitle: string;
    aiProvidersTitle: string;
    aiProvidersDescription: string;
    moveUpButton: string;
    moveDownButton: string;
    saveOrderButton: string;
    orderSavedToast: string;
    orderSaveFailedError: string;
  };
  login: {
    setupTitle: string;
    loginTitle: string;
    setupDescription: string;
    loginDescription: string;
    pinPlaceholder: string;
    savePinButton: string;
    loginButton: string;
    pinTooShortError: string;
    incorrectPinError: string;
  };
  entryEditor: {
    editTitle: string;
    addTitle: string;
    entryTypeLabel: string;
    entryTypeSubjectOption: string;
    entryTypeContextOption: string;
    subjectLabel: string;
    allGradesLabel: string;
    gradeLevelLabel: string;
    contextKeyLabel: string;
    isMainArticleLabel: string;
    titleLabel: string;
    contentLabel: string;
    pedagogicalNotesLabel: string;
    attachmentLabel: string;
    saveButton: string;
    cancelButton: string;
    contentTooShortError: string;
    contextKeyRequiredError: string;
    savingStatus: string;
    imageTooLargeError: string;
    entrySavedToast: string;
    saveFailedError: string;
    saveFailedToast: string;
  };
  entryList: {
    loading: string;
    loadError: string;
    empty: string;
    editButton: string;
    deleteButton: string;
    deleteConfirm: string;
    deletedToast: string;
    deleteFailedToast: string;
    allGradesBadge: string;
    contextBadge: string;
    mainArticleBadge: string;
    subArticleBadge: string;
  };
}

const en: TranslationDict = {
  common: { grade: 'Grade' },
  selector: {
    title: 'AI Homework Chatbot',
    subtitle: 'Select your grade level and subject to start a homework session.',
    gradeLevelLabel: 'Grade Level',
    subjectLabel: 'Subject',
    subjectForcedLabel: 'Subject:',
    subjectOtherOption: 'Other...',
    subjectPlaceholder: 'Enter subject',
    startButton: 'Start Session',
  },
  chat: {
    thinking: 'Thinking...',
    inputPlaceholder: 'Type your message...',
    sendButton: 'Send',
    errorNotConfigured: 'The AI service is not configured. Please contact an administrator.',
    errorUnauthorized: 'AI provider authorization failed. The administrator needs to check the API key.',
    errorRateLimited: "We're a bit busy right now. Please try again in about a minute.",
    errorUnavailable: 'The AI service is temporarily unavailable. Please try again shortly.',
    errorNetwork: 'Connection problem. Check your internet and try again.',
    errorGeneric: 'Something went wrong. Please try again.',
    aiProviderWarning:
      'This feature runs on a free, rate-limited AI provider, so it may be temporarily throttled at busy times. This will be improved in the future.',
    providerLabel: 'Provider',
    modelLabel: 'Model',
    welcomeMessage: "Hi! I'm your {subject} tutor for grade {gradeLevel}. Ask me a question, or ask for a practice problem whenever you're ready.",
  },
  guardrails: {
    redirectMessage:
      "Let's stay focused on your {subject} homework — that question is outside what I can help with here. Want another practice problem?",
  },
  admin: {
    firebaseNotConfiguredTitle: 'Firebase is not configured',
    firebaseNotConfiguredDescription: 'The shared knowledge base requires a Firebase project.',
    firebaseStep1: 'Create a project at <a href="https://console.firebase.google.com" target="_blank">Firebase Console</a>',
    firebaseStep2: 'Enable Cloud Firestore (Native mode)',
    firebaseStep3: 'Copy your web app config into <code>.env</code> (see the placeholder variables)',
    firebaseStep4: 'Restart the dev server (<code>npm run dev</code>)',
    dbErrorTitle: 'Unable to reach the shared database.',
    dbErrorDescription: 'Check your connection, Firestore security rules, and browser console for details.',
    knowledgeBaseNavLabel: 'Knowledge Base',
    settingsNavLabel: 'Settings',
    knowledgeBaseTitle: 'Knowledge Base',
    addEntryButton: 'Add Entry',
    settingsTitle: 'Settings',
    aiProvidersTitle: 'AI Providers',
    aiProvidersDescription:
      'Order in which AI providers are tried. The first configured provider in this list handles each request; if it fails, the next one is tried.',
    moveUpButton: 'Move up',
    moveDownButton: 'Move down',
    saveOrderButton: 'Save Order',
    orderSavedToast: 'Provider order saved.',
    orderSaveFailedError: 'Failed to save provider order.',
  },
  login: {
    setupTitle: 'Set Admin PIN',
    loginTitle: 'Admin Login',
    setupDescription: 'No PIN has been configured yet. Choose one to protect the admin area.',
    loginDescription: 'Enter the admin PIN to continue.',
    pinPlaceholder: 'PIN',
    savePinButton: 'Save PIN',
    loginButton: 'Log In',
    pinTooShortError: 'PIN must be at least 4 characters.',
    incorrectPinError: 'Incorrect PIN.',
  },
  entryEditor: {
    editTitle: 'Edit Entry',
    addTitle: 'Add Entry',
    entryTypeLabel: 'Entry Type',
    entryTypeSubjectOption: 'Subject-based',
    entryTypeContextOption: 'App Context',
    subjectLabel: 'Subject',
    allGradesLabel: 'All grades',
    gradeLevelLabel: 'Grade Level',
    contextKeyLabel: 'Context Key (host app name)',
    isMainArticleLabel: 'Main article for this context',
    titleLabel: 'Title',
    contentLabel: 'Content',
    pedagogicalNotesLabel: 'Pedagogical Notes',
    attachmentLabel: 'Attachment (optional image, max 1MB)',
    saveButton: 'Save',
    cancelButton: 'Cancel',
    contentTooShortError: 'Content must be at least 10 characters.',
    contextKeyRequiredError: 'Context Key is required for App Context entries.',
    savingStatus: 'Saving...',
    imageTooLargeError: 'Image is too large (max 1MB).',
    entrySavedToast: 'Entry saved.',
    saveFailedError: 'Failed to save entry.',
    saveFailedToast: 'Failed to save entry.',
  },
  entryList: {
    loading: 'Loading knowledge entries...',
    loadError: 'Unable to load knowledge entries.',
    empty: 'No knowledge entries yet.',
    editButton: 'Edit',
    deleteButton: 'Delete',
    deleteConfirm: 'Delete "{title}"?',
    deletedToast: 'Entry deleted.',
    deleteFailedToast: 'Failed to delete entry.',
    allGradesBadge: 'All grades',
    contextBadge: 'Context: {key}',
    mainArticleBadge: 'Main article',
    subArticleBadge: 'Sub-article',
  },
};

const fr: TranslationDict = {
  common: { grade: 'Année' },
  selector: {
    title: "Chatbot d'aide aux devoirs IA",
    subtitle: 'Sélectionnez votre niveau scolaire et votre matière pour commencer une session de devoirs.',
    gradeLevelLabel: 'Niveau scolaire',
    subjectLabel: 'Matière',
    subjectForcedLabel: 'Matière :',
    subjectOtherOption: 'Autre...',
    subjectPlaceholder: 'Entrez la matière',
    startButton: 'Commencer la session',
  },
  chat: {
    thinking: 'Réflexion en cours...',
    inputPlaceholder: 'Tapez votre message...',
    sendButton: 'Envoyer',
    errorNotConfigured: "Le service IA n'est pas configuré. Veuillez contacter un administrateur.",
    errorUnauthorized: "L'autorisation du fournisseur IA a échoué. L'administrateur doit vérifier la clé API.",
    errorRateLimited: 'Nous sommes un peu occupés en ce moment. Veuillez réessayer dans environ une minute.',
    errorUnavailable: 'Le service IA est temporairement indisponible. Veuillez réessayer sous peu.',
    errorNetwork: 'Problème de connexion. Vérifiez votre connexion Internet et réessayez.',
    errorGeneric: "Une erreur s'est produite. Veuillez réessayer.",
    aiProviderWarning:
      "Cette fonctionnalité repose sur un fournisseur d'IA gratuit à capacité limitée ; elle peut donc être temporairement ralentie aux heures d'affluence. Ce sera amélioré à l'avenir.",
    providerLabel: 'Fournisseur',
    modelLabel: 'Modèle',
    welcomeMessage: 'Bonjour ! Je suis ton tuteur de {subject} pour la {gradeLevel}e année. Pose-moi une question, ou demande un exercice quand tu seras prêt.',
  },
  guardrails: {
    redirectMessage:
      'Restons concentrés sur vos devoirs de {subject} — cette question sort du cadre de ce que je peux vous aider ici. Voulez-vous un autre exercice ?',
  },
  admin: {
    firebaseNotConfiguredTitle: "Firebase n'est pas configuré",
    firebaseNotConfiguredDescription: 'La base de connaissances partagée nécessite un projet Firebase.',
    firebaseStep1: 'Créez un projet sur <a href="https://console.firebase.google.com" target="_blank">Firebase Console</a>',
    firebaseStep2: 'Activez Cloud Firestore (mode natif)',
    firebaseStep3: "Copiez la configuration de votre application web dans <code>.env</code> (voir les variables d'espace réservé)",
    firebaseStep4: 'Redémarrez le serveur de développement (<code>npm run dev</code>)',
    dbErrorTitle: "Impossible d'accéder à la base de données partagée.",
    dbErrorDescription: 'Vérifiez votre connexion, les règles de sécurité Firestore et la console du navigateur pour plus de détails.',
    knowledgeBaseNavLabel: 'Base de connaissances',
    settingsNavLabel: 'Paramètres',
    knowledgeBaseTitle: 'Base de connaissances',
    addEntryButton: 'Ajouter une entrée',
    settingsTitle: 'Paramètres',
    aiProvidersTitle: 'Fournisseurs IA',
    aiProvidersDescription:
      "Ordre dans lequel les fournisseurs IA sont essayés. Le premier fournisseur configuré de cette liste traite chaque requête ; s'il échoue, le suivant est essayé.",
    moveUpButton: 'Monter',
    moveDownButton: 'Descendre',
    saveOrderButton: "Enregistrer l'ordre",
    orderSavedToast: "Ordre des fournisseurs enregistré.",
    orderSaveFailedError: "Échec de l'enregistrement de l'ordre des fournisseurs.",
  },
  login: {
    setupTitle: 'Définir le NIP administrateur',
    loginTitle: 'Connexion administrateur',
    setupDescription: "Aucun NIP n'a encore été configuré. Choisissez-en un pour protéger la zone d'administration.",
    loginDescription: 'Entrez le NIP administrateur pour continuer.',
    pinPlaceholder: 'NIP',
    savePinButton: 'Enregistrer le NIP',
    loginButton: 'Connexion',
    pinTooShortError: 'Le NIP doit contenir au moins 4 caractères.',
    incorrectPinError: 'NIP incorrect.',
  },
  entryEditor: {
    editTitle: "Modifier l'entrée",
    addTitle: 'Ajouter une entrée',
    entryTypeLabel: "Type d'entrée",
    entryTypeSubjectOption: 'Basé sur une matière',
    entryTypeContextOption: "Contexte d'application",
    subjectLabel: 'Matière',
    allGradesLabel: 'Tous les niveaux',
    gradeLevelLabel: 'Niveau scolaire',
    contextKeyLabel: "Clé de contexte (nom de l'application hôte)",
    isMainArticleLabel: 'Article principal pour ce contexte',
    titleLabel: 'Titre',
    contentLabel: 'Contenu',
    pedagogicalNotesLabel: 'Notes pédagogiques',
    attachmentLabel: 'Pièce jointe (image facultative, max 1 Mo)',
    saveButton: 'Enregistrer',
    cancelButton: 'Annuler',
    contentTooShortError: 'Le contenu doit comporter au moins 10 caractères.',
    contextKeyRequiredError: "La clé de contexte est requise pour les entrées de type contexte d'application.",
    savingStatus: 'Enregistrement en cours...',
    imageTooLargeError: "L'image est trop volumineuse (max 1 Mo).",
    entrySavedToast: 'Entrée enregistrée.',
    saveFailedError: "Échec de l'enregistrement de l'entrée.",
    saveFailedToast: "Échec de l'enregistrement de l'entrée.",
  },
  entryList: {
    loading: 'Chargement des entrées de la base de connaissances...',
    loadError: 'Impossible de charger les entrées de la base de connaissances.',
    empty: 'Aucune entrée dans la base de connaissances.',
    editButton: 'Modifier',
    deleteButton: 'Supprimer',
    deleteConfirm: 'Supprimer « {title} » ?',
    deletedToast: 'Entrée supprimée.',
    deleteFailedToast: "Échec de la suppression de l'entrée.",
    allGradesBadge: 'Tous les niveaux',
    contextBadge: 'Contexte : {key}',
    mainArticleBadge: 'Article principal',
    subArticleBadge: 'Article secondaire',
  },
};

const es: TranslationDict = {
  common: { grade: 'Grado' },
  selector: {
    title: 'Chatbot de ayuda con tareas con IA',
    subtitle: 'Selecciona tu nivel de grado y materia para comenzar una sesión de tareas.',
    gradeLevelLabel: 'Nivel de grado',
    subjectLabel: 'Materia',
    subjectForcedLabel: 'Materia:',
    subjectOtherOption: 'Otra...',
    subjectPlaceholder: 'Ingresa la materia',
    startButton: 'Iniciar sesión',
  },
  chat: {
    thinking: 'Pensando...',
    inputPlaceholder: 'Escribe tu mensaje...',
    sendButton: 'Enviar',
    errorNotConfigured: 'El servicio de IA no está configurado. Por favor, contacta a un administrador.',
    errorUnauthorized: 'La autorización del proveedor de IA falló. El administrador necesita verificar la clave API.',
    errorRateLimited: 'Estamos un poco ocupados en este momento. Inténtalo de nuevo en aproximadamente un minuto.',
    errorUnavailable: 'El servicio de IA no está disponible temporalmente. Inténtalo de nuevo en breve.',
    errorNetwork: 'Problema de conexión. Revisa tu conexión a Internet e inténtalo de nuevo.',
    errorGeneric: 'Algo salió mal. Inténtalo de nuevo.',
    aiProviderWarning:
      'Esta función utiliza un proveedor de IA gratuito y de capacidad limitada, por lo que puede verse temporalmente restringida en horas de mucho uso. Esto se mejorará en el futuro.',
    providerLabel: 'Proveedor',
    modelLabel: 'Modelo',
    welcomeMessage: '¡Hola! Soy tu tutor de {subject} para el grado {gradeLevel}. Hazme una pregunta o pide un ejercicio de práctica cuando estés listo.',
  },
  guardrails: {
    redirectMessage:
      'Mantengámonos enfocados en tu tarea de {subject}; esa pregunta está fuera de lo que puedo ayudarte aquí. ¿Quieres otro problema de práctica?',
  },
  admin: {
    firebaseNotConfiguredTitle: 'Firebase no está configurado',
    firebaseNotConfiguredDescription: 'La base de conocimientos compartida requiere un proyecto de Firebase.',
    firebaseStep1: 'Crea un proyecto en <a href="https://console.firebase.google.com" target="_blank">Firebase Console</a>',
    firebaseStep2: 'Habilita Cloud Firestore (modo nativo)',
    firebaseStep3: 'Copia la configuración de tu aplicación web en <code>.env</code> (consulta las variables de marcador de posición)',
    firebaseStep4: 'Reinicia el servidor de desarrollo (<code>npm run dev</code>)',
    dbErrorTitle: 'No se puede acceder a la base de datos compartida.',
    dbErrorDescription: 'Revisa tu conexión, las reglas de seguridad de Firestore y la consola del navegador para más detalles.',
    knowledgeBaseNavLabel: 'Base de conocimientos',
    settingsNavLabel: 'Configuración',
    knowledgeBaseTitle: 'Base de conocimientos',
    addEntryButton: 'Agregar entrada',
    settingsTitle: 'Configuración',
    aiProvidersTitle: 'Proveedores de IA',
    aiProvidersDescription:
      'Orden en que se prueban los proveedores de IA. El primer proveedor configurado de esta lista maneja cada solicitud; si falla, se prueba el siguiente.',
    moveUpButton: 'Subir',
    moveDownButton: 'Bajar',
    saveOrderButton: 'Guardar orden',
    orderSavedToast: 'Orden de proveedores guardado.',
    orderSaveFailedError: 'No se pudo guardar el orden de proveedores.',
  },
  login: {
    setupTitle: 'Establecer PIN de administrador',
    loginTitle: 'Inicio de sesión de administrador',
    setupDescription: 'Aún no se ha configurado un PIN. Elige uno para proteger el área de administración.',
    loginDescription: 'Ingresa el PIN de administrador para continuar.',
    pinPlaceholder: 'PIN',
    savePinButton: 'Guardar PIN',
    loginButton: 'Iniciar sesión',
    pinTooShortError: 'El PIN debe tener al menos 4 caracteres.',
    incorrectPinError: 'PIN incorrecto.',
  },
  entryEditor: {
    editTitle: 'Editar entrada',
    addTitle: 'Agregar entrada',
    entryTypeLabel: 'Tipo de entrada',
    entryTypeSubjectOption: 'Basado en materia',
    entryTypeContextOption: 'Contexto de aplicación',
    subjectLabel: 'Materia',
    allGradesLabel: 'Todos los grados',
    gradeLevelLabel: 'Nivel de grado',
    contextKeyLabel: 'Clave de contexto (nombre de la app anfitriona)',
    isMainArticleLabel: 'Artículo principal para este contexto',
    titleLabel: 'Título',
    contentLabel: 'Contenido',
    pedagogicalNotesLabel: 'Notas pedagógicas',
    attachmentLabel: 'Archivo adjunto (imagen opcional, máx. 1 MB)',
    saveButton: 'Guardar',
    cancelButton: 'Cancelar',
    contentTooShortError: 'El contenido debe tener al menos 10 caracteres.',
    contextKeyRequiredError: 'La clave de contexto es obligatoria para entradas de contexto de aplicación.',
    savingStatus: 'Guardando...',
    imageTooLargeError: 'La imagen es demasiado grande (máx. 1 MB).',
    entrySavedToast: 'Entrada guardada.',
    saveFailedError: 'No se pudo guardar la entrada.',
    saveFailedToast: 'No se pudo guardar la entrada.',
  },
  entryList: {
    loading: 'Cargando entradas de la base de conocimientos...',
    loadError: 'No se pudieron cargar las entradas de la base de conocimientos.',
    empty: 'Aún no hay entradas en la base de conocimientos.',
    editButton: 'Editar',
    deleteButton: 'Eliminar',
    deleteConfirm: '¿Eliminar "{title}"?',
    deletedToast: 'Entrada eliminada.',
    deleteFailedToast: 'No se pudo eliminar la entrada.',
    allGradesBadge: 'Todos los grados',
    contextBadge: 'Contexto: {key}',
    mainArticleBadge: 'Artículo principal',
    subArticleBadge: 'Artículo secundario',
  },
};

const DICTS: Record<Locale, TranslationDict> = { en, fr, es };

type DotPath<T> = { [K in keyof T & string]: `${K}.${keyof T[K] & string}` }[keyof T & string];

/** Looks up a translated string for the current locale and substitutes `{var}` placeholders. */
export function t(path: DotPath<TranslationDict>, vars?: Record<string, string | number>): string {
  const [section, key] = path.split('.') as [keyof TranslationDict, string];
  const dict = DICTS[getLocale()][section] as Record<string, string>;
  let str = dict[key] ?? path;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replaceAll(`{${k}}`, String(v));
    }
  }
  return str;
}
