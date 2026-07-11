import {createSlice} from "@reduxjs/toolkit";

const initialState = {
    Companies: [],
    
};


const InsideWorkSpacesSlice = createSlice({
    name: "InsideWorkSpaces",
    initialState,
    reducers: {
        setCompanies(state, action) {
            state.Companies = action.payload;
        },
        removeCompany(state, action) {
            state.Companies = state.Companies.filter((c) => c.id !== action.payload && c.id?.toString() !== action.payload?.toString());
        },
        updateCompany(state, action) {
            const { index, updatedCompany } = action.payload;
            state.Companies[index] = updatedCompany;
        },
        addCompany(state, action) {
            state.Companies.push(action.payload);
        }
    },
});

export const {setCompanies, removeCompany, updateCompany, addCompany} = InsideWorkSpacesSlice.actions;
const InsideWorkSpacesReducer = InsideWorkSpacesSlice.reducer;
export { InsideWorkSpacesReducer };