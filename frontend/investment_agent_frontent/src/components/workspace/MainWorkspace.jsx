import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import axiosInstance from "../../utils/axiosConfig";
import { setCompanies, removeCompany } from "../../store/InsideWorkSpaces";
import {
    ReactFlow,
    Background,
    Controls,
    applyNodeChanges,
    applyEdgeChanges,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import CompanyInputBox from "./intialInputBox/CompanyInputBox";
import { useParams } from "react-router-dom";

const nodeTypes = {
    inputBox: CompanyInputBox,
    companyNode: CompanyInputBox,
};

const MainWorkspace = () => {
    const [nodes, setNodes] = useState([{ id: '1', type: 'inputBox', position: { x: 0, y: 0 }, data: {} }]);
    const [edges, setEdges] = useState([]);
    const dispatch = useDispatch();
    const companies = useSelector((state) => state.InsideWorkSpaces.Companies);
    const { workspaceId } = useParams();

    // Fetch companies for this workspace
    useEffect(() => {
        if (!workspaceId) return;
        const fetchCompanies = async () => {
            try {
                const response = await axiosInstance.get(`/api/v1/workspace/${workspaceId}`);
                // ApiResponse shape: { statusCode, data: { id, name, companies: [...] }, message }
                const companies = response.data?.data?.companies;
                if (companies && Array.isArray(companies)) {
                    dispatch(setCompanies(companies));
                } else {
                    console.error("Unexpected response shape:", response.data);
                }
            } catch (error) {
                console.error("Error fetching companies:", error);
            }
        };
        fetchCompanies();
    }, [dispatch, workspaceId]); // re-fetch when navigating between workspaces

    // Sync Redux companies → React Flow nodes (in useEffect to avoid infinite loop)
    useEffect(() => {
        const inputNode = { id: '1', type: 'inputBox', position: { x: 0, y: 0 }, data: {} };
        if (!companies || companies.length === 0) {
            setNodes([inputNode]);
        } else {
            setNodes([
                inputNode,
                ...companies.map((company, index) => ({
                    id: company.companyNodeData?.id || company.id.toString(),
                    type: 'companyNode',
                    position: company.companyNodeData?.position || { x: 250, y: index * 150 },
                    data: company?.rawData || {},
                }))
            ]);
        }
    }, [companies]); // only re-runs when companies array changes

    const onNodesChange = useCallback(
        (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
        []
    );

    const onEdgesChange = useCallback(
        (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        []
    );

    // Auto-connect all company nodes to the root input node
    useEffect(() => {
        const rootNodeId = '1';
        const newEdges = nodes
            .filter(node => node.id !== rootNodeId)
            .map(node => ({
                id: `e${rootNodeId}-${node.id}`,
                source: rootNodeId,
                target: node.id,
                style: { stroke: '#000' },
            }));
        setEdges(newEdges);
    }, [nodes]);

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
};

export default MainWorkspace;