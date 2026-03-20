
import ProjectView from '@/modules/projects/components/ProjectView'


const page = async({params}:{params:{projectId:string}}) => {
    const {projectId} = await params
  return (
    <div className='h-screen'>
        <ProjectView projectId={projectId}/>
    </div>
  )
}

export default page