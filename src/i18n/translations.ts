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
    hostAppsNavLabel: string;
    hostAppsTitle: string;
    hostAppsDescription: string;
    hostAppsLoadingStatus: string;
    hostAppsLoadFailedError: string;
    hostAppsNoSelectionStatus: string;
    hostAppsNewContextKeyLabel: string;
    hostAppsNewContextKeyPlaceholder: string;
    hostAppsNewButton: string;
    hostAppsSystemPromptLabel: string;
    hostAppsOffTopicKeywordsLabel: string;
    hostAppsOffTopicKeywordsPlaceholder: string;
    hostAppsRedirectMessageLabel: string;
    hostAppsSaveButton: string;
    hostAppsSavingStatus: string;
    hostAppsSavedToast: string;
    hostAppsSaveFailedError: string;
    hostAppsSaveFailedToast: string;
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
    searchLabel: string;
    searchPlaceholder: string;
    entryTypeFilterLabel: string;
    allEntryTypesOption: string;
    subjectOption: string;
    contextOption: string;
    subjectFilterLabel: string;
    allSubjectsOption: string;
    gradeFilterLabel: string;
    allGradesOption: string;
    contextKeyFilterLabel: string;
    allContextKeysOption: string;
    mainArticleFilterLabel: string;
    allArticleTypesOption: string;
    mainArticleOption: string;
    subArticleOption: string;
    resetFiltersButton: string;
    tableTitleHeader: string;
    tableEntryTypeHeader: string;
    tableDetailHeader: string;
    tableMetaHeader: string;
    tableActionsHeader: string;
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
    welcomeMessage: "Hi! I'm your {subject} tutor. Ask me a question, or ask for a practice problem whenever you're ready.",
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
    hostAppsNavLabel: 'Host Apps',
    hostAppsTitle: 'Host Apps',
    hostAppsDescription:
      'Each embedding host app can supply its own tutor system prompt and off-topic guardrails, matched by the `context` attribute it passes. Hosts without a configuration here fall back to a built-in "please embed and configure me" prompt.',
    hostAppsLoadingStatus: 'Loading...',
    hostAppsLoadFailedError: 'Unable to load host app configurations.',
    hostAppsNoSelectionStatus: 'Select a host app on the left, or add a new one.',
    hostAppsNewContextKeyLabel: 'New host context key',
    hostAppsNewContextKeyPlaceholder: 'e.g. ScalesViewer',
    hostAppsNewButton: 'Add',
    hostAppsSystemPromptLabel: 'System Prompt',
    hostAppsOffTopicKeywordsLabel: 'Off-topic Keywords',
    hostAppsOffTopicKeywordsPlaceholder: 'One keyword or phrase per line',
    hostAppsRedirectMessageLabel: 'Off-topic Redirect Message',
    hostAppsSaveButton: 'Save',
    hostAppsSavingStatus: 'Saving...',
    hostAppsSavedToast: 'Host app configuration saved.',
    hostAppsSaveFailedError: 'Failed to save host app configuration.',
    hostAppsSaveFailedToast: 'Failed to save host app configuration.',
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
    empty: 'No knowledge entries match your filters.',
    editButton: 'Edit',
    deleteButton: 'Delete',
    deleteConfirm: 'Delete "{title}"?',
    deletedToast: 'Entry deleted.',
    deleteFailedToast: 'Failed to delete entry.',
    allGradesBadge: 'All grades',
    contextBadge: 'Context: {key}',
    mainArticleBadge: 'Main article',
    subArticleBadge: 'Sub-article',
    searchLabel: 'Search',
    searchPlaceholder: 'Search by title or content...',
    entryTypeFilterLabel: 'Entry Type',
    allEntryTypesOption: 'All types',
    subjectOption: 'Subject-based',
    contextOption: 'App Context',
    subjectFilterLabel: 'Subject',
    allSubjectsOption: 'All subjects',
    gradeFilterLabel: 'Grade Level',
    allGradesOption: 'All grades',
    contextKeyFilterLabel: 'Context Key',
    allContextKeysOption: 'All context keys',
    mainArticleFilterLabel: 'Article Type',
    allArticleTypesOption: 'All articles',
    mainArticleOption: 'Main articles only',
    subArticleOption: 'Sub-articles only',
    resetFiltersButton: 'Reset Filters',
    tableTitleHeader: 'Title',
    tableEntryTypeHeader: 'Type',
    tableDetailHeader: 'Detail',
    tableMetaHeader: 'Metadata',
    tableActionsHeader: 'Actions',
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
    welcomeMessage: 'Bonjour ! Je suis ton tuteur de {subject}. Pose-moi une question, ou demande un exercice quand tu seras prêt.',
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
    hostAppsNavLabel: 'Applications hôtes',
    hostAppsTitle: 'Applications hôtes',
    hostAppsDescription:
      "Chaque application hôte intégrant l'outil peut fournir son propre prompt système et ses propres garde-fous hors-sujet, associés à l'attribut `context` qu'elle transmet. Les hôtes sans configuration ici utilisent un prompt par défaut demandant d'intégrer et de configurer l'outil.",
    hostAppsLoadingStatus: 'Chargement...',
    hostAppsLoadFailedError: 'Impossible de charger les configurations des applications hôtes.',
    hostAppsNoSelectionStatus: 'Sélectionnez une application hôte à gauche, ou ajoutez-en une nouvelle.',
    hostAppsNewContextKeyLabel: "Clé de contexte du nouvel hôte",
    hostAppsNewContextKeyPlaceholder: 'ex. ScalesViewer',
    hostAppsNewButton: 'Ajouter',
    hostAppsSystemPromptLabel: 'Prompt système',
    hostAppsOffTopicKeywordsLabel: 'Mots-clés hors-sujet',
    hostAppsOffTopicKeywordsPlaceholder: 'Un mot-clé ou une expression par ligne',
    hostAppsRedirectMessageLabel: 'Message de redirection hors-sujet',
    hostAppsSaveButton: 'Enregistrer',
    hostAppsSavingStatus: 'Enregistrement en cours...',
    hostAppsSavedToast: "Configuration de l'application hôte enregistrée.",
    hostAppsSaveFailedError: "Échec de l'enregistrement de la configuration de l'application hôte.",
    hostAppsSaveFailedToast: "Échec de l'enregistrement de la configuration de l'application hôte.",
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
    empty: 'Aucune entrée ne correspond à vos filtres.',
    editButton: 'Modifier',
    deleteButton: 'Supprimer',
    deleteConfirm: 'Supprimer « {title} » ?',
    deletedToast: 'Entrée supprimée.',
    deleteFailedToast: "Échec de la suppression de l'entrée.",
    allGradesBadge: 'Tous les niveaux',
    contextBadge: 'Contexte : {key}',
    mainArticleBadge: 'Article principal',
    subArticleBadge: 'Article secondaire',
    searchLabel: 'Rechercher',
    searchPlaceholder: 'Rechercher par titre ou contenu...',
    entryTypeFilterLabel: "Type d'entrée",
    allEntryTypesOption: 'Tous les types',
    subjectOption: 'Basé sur une matière',
    contextOption: "Contexte d'application",
    subjectFilterLabel: 'Matière',
    allSubjectsOption: 'Toutes les matières',
    gradeFilterLabel: 'Niveau scolaire',
    allGradesOption: 'Tous les niveaux',
    contextKeyFilterLabel: 'Clé de contexte',
    allContextKeysOption: 'Toutes les clés de contexte',
    mainArticleFilterLabel: 'Type d\'article',
    allArticleTypesOption: 'Tous les articles',
    mainArticleOption: 'Articles principaux uniquement',
    subArticleOption: 'Articles secondaires uniquement',
    resetFiltersButton: 'Réinitialiser les filtres',
    tableTitleHeader: 'Titre',
    tableEntryTypeHeader: 'Type',
    tableDetailHeader: 'Détails',
    tableMetaHeader: 'Métadonnées',
    tableActionsHeader: 'Actions',
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
    welcomeMessage: '¡Hola! Soy tu tutor de {subject}. Hazme una pregunta o pide un ejercicio de práctica cuando estés listo.',
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
    hostAppsNavLabel: 'Apps anfitrionas',
    hostAppsTitle: 'Apps anfitrionas',
    hostAppsDescription:
      'Cada app anfitriona que integra la herramienta puede proporcionar su propio prompt del sistema y sus propias barreras de protección para temas fuera de contexto, según el atributo `context` que envía. Los hosts sin configuración aquí usan un prompt predeterminado que pide integrar y configurar la herramienta.',
    hostAppsLoadingStatus: 'Cargando...',
    hostAppsLoadFailedError: 'No se pudieron cargar las configuraciones de las apps anfitrionas.',
    hostAppsNoSelectionStatus: 'Selecciona una app anfitriona a la izquierda, o agrega una nueva.',
    hostAppsNewContextKeyLabel: 'Clave de contexto del nuevo host',
    hostAppsNewContextKeyPlaceholder: 'ej. ScalesViewer',
    hostAppsNewButton: 'Agregar',
    hostAppsSystemPromptLabel: 'Prompt del sistema',
    hostAppsOffTopicKeywordsLabel: 'Palabras clave fuera de tema',
    hostAppsOffTopicKeywordsPlaceholder: 'Una palabra clave o frase por línea',
    hostAppsRedirectMessageLabel: 'Mensaje de redirección fuera de tema',
    hostAppsSaveButton: 'Guardar',
    hostAppsSavingStatus: 'Guardando...',
    hostAppsSavedToast: 'Configuración de la app anfitriona guardada.',
    hostAppsSaveFailedError: 'No se pudo guardar la configuración de la app anfitriona.',
    hostAppsSaveFailedToast: 'No se pudo guardar la configuración de la app anfitriona.',
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
    empty: 'No se encontraron entradas que coincidan con los filtros.',
    editButton: 'Editar',
    deleteButton: 'Eliminar',
    deleteConfirm: '¿Eliminar "{title}"?',
    deletedToast: 'Entrada eliminada.',
    deleteFailedToast: 'No se pudo eliminar la entrada.',
    allGradesBadge: 'Todos los grados',
    contextBadge: 'Contexto: {key}',
    mainArticleBadge: 'Artículo principal',
    subArticleBadge: 'Artículo secundario',
    searchLabel: 'Buscar',
    searchPlaceholder: 'Buscar por título o contenido...',
    entryTypeFilterLabel: 'Tipo de entrada',
    allEntryTypesOption: 'Todos los tipos',
    subjectOption: 'Basado en materia',
    contextOption: 'Contexto de aplicación',
    subjectFilterLabel: 'Materia',
    allSubjectsOption: 'Todas las materias',
    gradeFilterLabel: 'Nivel de grado',
    allGradesOption: 'Todos los grados',
    contextKeyFilterLabel: 'Clave de contexto',
    allContextKeysOption: 'Todas las claves de contexto',
    mainArticleFilterLabel: 'Tipo de artículo',
    allArticleTypesOption: 'Todos los artículos',
    mainArticleOption: 'Solo artículos principales',
    subArticleOption: 'Solo artículos secundarios',
    resetFiltersButton: 'Restablecer filtros',
    tableTitleHeader: 'Título',
    tableEntryTypeHeader: 'Tipo',
    tableDetailHeader: 'Detalles',
    tableMetaHeader: 'Metadatos',
    tableActionsHeader: 'Acciones',
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
