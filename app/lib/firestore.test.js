import { addResource } from './firestore';
import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

jest.mock('./firebase', () => ({
  db: {}
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
  serverTimestamp: jest.fn(() => 'mocked-timestamp')
}));

describe('Firestore API - Resources', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('addResource adds a document to resources collection', async () => {
    const mockDocRef = { id: 'test-id' };
    addDoc.mockResolvedValue(mockDocRef);
    collection.mockReturnValue('mocked-collection');

    const resourceData = {
      name: 'Test Resource',
      category: 'Test Category',
      downloadUrl: 'https://test.com'
    };

    const result = await addResource(resourceData);

    expect(collection).toHaveBeenCalledWith(db, 'resources');
    expect(addDoc).toHaveBeenCalledWith('mocked-collection', {
      ...resourceData,
      downloadCount: 0,
      isPublished: true,
      createdAt: 'mocked-timestamp',
      updatedAt: 'mocked-timestamp'
    });
    expect(result.id).toBe('test-id');
  });
});

import { addFolder } from './firestore';

describe('Firestore API - Folders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('addFolder adds a document to folders collection with null parentId if not provided', async () => {
    const mockDocRef = { id: 'folder-test-id' };
    addDoc.mockResolvedValue(mockDocRef);
    collection.mockReturnValue('mocked-folder-collection');

    const folderData = {
      name: 'Test Folder',
      categorySlug: 'test-category'
    };

    const result = await addFolder(folderData);

    expect(collection).toHaveBeenCalledWith(db, 'folders');
    expect(addDoc).toHaveBeenCalledWith('mocked-folder-collection', {
      ...folderData,
      parentId: null,
      resourceCount: 0,
      createdAt: 'mocked-timestamp'
    });
    expect(result.id).toBe('folder-test-id');
  });

  it('addFolder adds a document to folders collection with provided parentId', async () => {
    const mockDocRef = { id: 'folder-test-id-2' };
    addDoc.mockResolvedValue(mockDocRef);
    collection.mockReturnValue('mocked-folder-collection');

    const folderData = {
      name: 'Sub Folder',
      categorySlug: 'test-category',
      parentId: 'parent-folder-id'
    };

    const result = await addFolder(folderData);

    expect(collection).toHaveBeenCalledWith(db, 'folders');
    expect(addDoc).toHaveBeenCalledWith('mocked-folder-collection', {
      ...folderData,
      parentId: 'parent-folder-id',
      resourceCount: 0,
      createdAt: 'mocked-timestamp'
    });
    expect(result.id).toBe('folder-test-id-2');
  });
});
