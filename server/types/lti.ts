export interface LTILoginRequest {
  iss: string;
  login_hint: string;
  target_link_uri: string;
  lti_message_hint?: string;
  client_id: string;
  lti_deployment_id?: string;
}

export interface LTISession {
  nonce: string;
  state: string;
  createdAt: FirebaseFirestore.Timestamp;
  expiresAt: FirebaseFirestore.Timestamp;
  userId?: string;
}

export interface LTILaunchToken {
  iss: string;
  aud: string;
  sub: string;
  exp: number;
  iat: number;
  nonce: string;
  'https://purl.imsglobal.org/spec/lti/claim/message_type': string;
  'https://purl.imsglobal.org/spec/lti/claim/version': string;
  'https://purl.imsglobal.org/spec/lti/claim/deployment_id': string;
  'https://purl.imsglobal.org/spec/lti/claim/target_link_uri': string;
  'https://purl.imsglobal.org/spec/lti/claim/resource_link': {
    id: string;
    title?: string;
    description?: string;
  };
  'https://purl.imsglobal.org/spec/lti/claim/roles': string[];
  'https://purl.imsglobal.org/spec/lti/claim/context'?: {
    id: string;
    label?: string;
    title?: string;
    type?: string[];
  };
  given_name?: string;
  family_name?: string;
  name?: string;
  email?: string;
  'https://purl.imsglobal.org/spec/lti-ags/claim/endpoint'?: {
    scope: string[];
    lineitems?: string;
    lineitem?: string;
  };
}

export interface UserData {
  ltiUserId: string;
  platformUserId: string;
  classeraEnabled: boolean;
  classeraRoles: string[];
  name: string;
  email: string;
  givenName?: string;
  familyName?: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface LTIContext {
  contextId: string;
  contextTitle?: string;
  contextLabel?: string;
  courseId?: string;
  platform: string;
  createdAt: FirebaseFirestore.Timestamp;
}

export interface LTIResourceLink {
  resourceLinkId: string;
  title?: string;
  description?: string;
  contextId: string;
  lineitemUrl?: string;
  createdAt: FirebaseFirestore.Timestamp;
}

export interface LTILaunchRecord {
  userId: string;
  contextId: string;
  resourceLinkId: string;
  timestamp: FirebaseFirestore.Timestamp;
  outcome: 'success' | 'failure';
  errorMessage?: string;
}

export interface GradePassback {
  userId: string;
  resourceLinkId: string;
  score: number;
  maxScore: number;
  status: 'pending' | 'sent' | 'failed';
  sentAt?: FirebaseFirestore.Timestamp;
  response?: string;
  createdAt: FirebaseFirestore.Timestamp;
}
