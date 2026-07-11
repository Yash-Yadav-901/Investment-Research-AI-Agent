import react from "react";
import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import axiosInstance from "../../axiosInstance";
import { setCompanies, removeCompany, updateCompany } from "../../store/InsideWorkSpaces";
import {
    ReactFlow,
    Background,
    Controls,
    applyNodeChanges,
    applyEdgeChanges,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import CompanyInputBox from "./intialInputBox/CompanyInputBox";


const nodeTypes = {
    inputBox : CompanyInputBox,
    companyNode: CompanyInputBox, 
}
const MainWorkspace = () => {
    const [nodes, setNodes] = useState([{ id: '1', type: 'inputBox', position: { x: 0, y: 0 } }]);
    const [edges, setEdges] = useState([]);
    const dispatch = useDispatch();
    const companies = useSelector((state) => state.InsideWorkSpaces.Companies);
    
    if(!companies || companies.length === 0) {
        console.log("No companies found in the Redux store.");
    } else {
        setNodes([ { id: '1', type: 'inputBox', position: { x: 0, y: 0 } }, ...companies.map((company, index) => ({
            id: company.companyNodeData?.id || company.id.toString(),
            type: 'companyNode',
            position: company.companyNodeData?.position || { x: 0, y: 0 },
            data: company?.rawData || {},
        }))]);
        console.log("Companies from Redux store:", companies);
    }

    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const response = await axiosInstance.get("/companies");
                if (response.data && Array.isArray(response.data)) {
                    dispatch(setCompanies(response.data));
                } else {
                    console.error("Invalid response data:", response.data);
                }
            } catch (error) {
                console.error("Error fetching companies:", error);
            }
        };

        fetchCompanies();
    }, [dispatch]);

    const onNodesChange = useCallback(
        (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
        []
    );

    const onEdgesChange = useCallback(
        (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        []
    );

    useEffect( ()=>{
        const rootNodeId='1';
        const newEdges= nodes.filter(node => node.id !== rootNodeId).map(node => ({
            id: `e${rootNodeId}-${node.id}`,
            source: rootNodeId, 
            target: node.id,
            // animated: true,
            style: { stroke: '#000' },
        }));
        setEdges(newEdges);
    },[nodes]);

    const removeNode = (id) => {
    setNodes((nds) => nds.filter((node) => node.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
    dispatch(removeCompany(id));
    };

    return (
        <div style={{ width: '100%', height: '100vh' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
            >
                <Background />
                <Controls />
            </ReactFlow>
        </div>
    );

}