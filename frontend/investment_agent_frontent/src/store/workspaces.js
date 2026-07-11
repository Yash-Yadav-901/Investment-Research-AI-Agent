import {createSlice} from "@reduxjs/toolkit";

const initialState = {
    workspaces: [],
    currentWorkspace: null,
};

const workspacesSlice = createSlice({
    name: "workspaces",
    initialState,
    reducers: {
        setWorkspaces(state, action) {
            state.workspaces = action.payload;
        },
        setCurrentWorkspace(state, action) {
            state.currentWorkspace = action.payload;
        },
        addNewWorkspace(state, action) {
            state.workspaces.push(action.payload);
        },
        removeWorkspace(state, action) {
            state.workspaces = state.workspaces.filter(
                (workspace) => workspace.id !== action.payload
            );
        },
    },
});

export const {setWorkspaces, setCurrentWorkspace} = workspacesSlice.actions;

export const workspacesReducer = workspacesSlice.reducer;