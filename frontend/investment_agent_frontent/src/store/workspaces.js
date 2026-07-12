import {createSlice} from "@reduxjs/toolkit";

const initialState = {
    workspaces: [],
    currentWorkspace: null,
    searchQuery: "",
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
        setSearchQuery(state, action) {
            state.searchQuery = action.payload;
        },
    },
});

export const {setWorkspaces, setCurrentWorkspace, addNewWorkspace, removeWorkspace, setSearchQuery} = workspacesSlice.actions;

export const workspacesReducer = workspacesSlice.reducer;