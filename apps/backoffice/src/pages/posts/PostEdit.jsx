import React from 'react';
import { useParams } from 'react-router-dom';
import PostEditor from './PostEditor';

export default function PostEdit() {
  const { postId } = useParams();
  return <PostEditor isEdit={true} postId={postId} />;
}
