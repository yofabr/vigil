enum PaneMode {
    AGENT,
    TERMINAL
}

struct Workspace {
    path: String,
    theme_color: String,
    groups: Vec<Group>,
    created_at: String,
    description: Option<String>,
}

struct Group {
    panes: Vec<Pane>
}

struct Pane {
    mode: PaneMode
}


// struct 1