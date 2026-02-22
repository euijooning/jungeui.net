import React from 'react';
import { useParams } from 'react-router-dom';
import ProjectForm from './ProjectForm';

export default function ProjectEdit() {
  const { id } = useParams();
  return <ProjectForm isEdit projectId={id} />;
}
