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
            state.Companies = state.Companies.filter((_, index) => index !== action.payload);
        },
        updateCompany(state, action) {
            const { index, updatedCompany } = action.payload;
            state.Companies[index] = updatedCompany;
        },
        addCompany(state, action) {
            state.Companies.push(action.payload);
        },
    },
});

export const {setCompanies, removeCompany, updateCompany} = InsideWorkSpacesSlice.actions;

export default InsideWorkSpacesSlice.reducer;