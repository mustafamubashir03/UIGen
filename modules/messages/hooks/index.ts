import { QueryClient, useMutation, useQuery,useQueryClient } from "@tanstack/react-query"
import { createMessage, getMessages } from "../actions"


export const prefetchMessages = ({queryClient,projectId}:{queryClient:QueryClient,projectId:string})=>{
    return queryClient.prefetchQuery({
        queryFn:()=>getMessages({projectId}),
        queryKey:["messages",projectId ],
        staleTime:10000

    })

}
export const useGetMessages = ({projectId}:{projectId:string})=>{
    return useQuery({
        queryFn:()=>getMessages({projectId}),
        queryKey:["messages",projectId ],
        staleTime:10000,
        refetchInterval: (query) => {
            const data = query.state.data
            return data?.length ? 5000 : false
          }

    })

}

export const useCreateMessage = ({projectId}:{projectId:string})=>{
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn:({value}:{value:string})=>createMessage({projectId,value}),
        onSuccess:()=>{
            queryClient.invalidateQueries({queryKey:["messages",projectId ]})
            queryClient.invalidateQueries({queryKey:["status"]})
        }
    })
}