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
import CompanyDashboard from "./companies/CompanyDashboard";
import { useParams } from "react-router-dom";

const nodeTypes = {
    inputBox: CompanyInputBox,
    companyNode: CompanyDashboard,
};

const MainWorkspace = () => {
    const { workspaceId } = useParams();
    const [nodes, setNodes] = useState([{ id: '1', type: 'inputBox', position: { x: 0, y: 0 }, data: { workspaceId } }]);
    const [edges, setEdges] = useState([]);
    const dispatch = useDispatch();
    const companies = useSelector((state) => state.InsideWorkSpaces.Companies);

    useEffect(() => {
        if (!workspaceId) return;
        const fetchCompanies = async () => {
            try {
                const response = await axiosInstance.get(`/api/v1/workspace/${workspaceId}`);
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
    }, [dispatch, workspaceId]); 

    useEffect(() => {
        const inputNode = { id: '1', type: 'inputBox', position: { x: 0, y: 0 }, data: { workspaceId } };
        if (!companies || companies.length === 0) {
            setNodes([inputNode]);
        } else {
            setNodes([
                inputNode,
                ...companies.map((company, index) => {
                    if (!company) return null;
                    return {
                        id: company.companyNodeData?.id || company.id?.toString() || `comp-${index}`,
                        type: 'companyNode',
                        position: company.companyNodeData?.position || { x: 300, y: index * 200 },
                        data: company,
                    };
                }).filter(Boolean)
            ]);
        }
    }, [companies, workspaceId]); 

    const onNodesChange = useCallback(
        (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
        []
    );

    const onEdgesChange = useCallback(
        (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        []
    );

    useEffect(() => {
        const rootNodeId = '1';
        const newEdges = nodes
            .filter(node => node.id !== rootNodeId)
            .map(node => ({
                id: `e${rootNodeId}-${node.id}`,
                source: rootNodeId,
                target: node.id,
                animated: true,
                style: { stroke: '#0F172A', strokeWidth: 3 },
            }));
        setEdges(newEdges);
    }, [nodes]);

    const removeNode = (id) => {
        setNodes((nds) => nds.filter((node) => node.id !== id));
        setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
        dispatch(removeCompany(id));
    };

    return (
        <div style={{ width: '100%', height: '100%' }} className="bg-[#FFFBEB]">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
            >
                <Background color="#0F172A" gap={20} size={1.5} variant="dots" opacity={0.15} />
                <Controls className="!bg-white !border-2 !border-[#0F172A] !rounded-xl !shadow-[2px_2px_0px_0px_#0F172A] [&>button]:!border-b [&>button]:!border-[#0F172A]/10 last:[&>button]:!border-b-0" />
            </ReactFlow>
        </div>
    );
};

export default MainWorkspace;