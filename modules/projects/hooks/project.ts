import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createProject, getProjectById, getProjects } from "../actions";


export const useGetProjects = ()=>{
    return useQuery({
        queryFn: getProjects,
        queryKey:["projects"]

    })
}

export const useGetProjectById = (projectId:string)=>{
    return useQuery({
        queryFn:()=>getProjectById(projectId),
        queryKey:["project",projectId]
    })
}

export const useCreateProject = ()=>{
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (value:string)=>createProject(value),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            queryClient.invalidateQueries({ queryKey: ["status"] });
          }
    })
}