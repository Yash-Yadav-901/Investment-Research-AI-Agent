import { configureStore } from "@reduxjs/toolkit";
import storage from "redux-persist/lib/storage";
import { combineReducers } from "redux";
import { persistReducer, persistStore, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from "redux-persist";
import {workspacesReducer} from "./workspaces";
import { createMigrate } from "redux-persist";
import InsideWorkSpacesReducer from "./InsideWorkSpaces";


const rootReducer = combineReducers({
    workspaces: workspacesReducer,
    InsideWorkSpaces: InsideWorkSpacesReducer,
});


const migrations = {
    2: () => undefined,
};

const persistConfig = {
    key: "root",
    version: 2,
    storage,
    whitelist: ["workspaces"],
    migrate: createMigrate(migrations, { debug: false }),
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
            },
        }),
});

export const persistor = persistStore(store);