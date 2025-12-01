const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const multer = require('multer'); // For handling file uploads
const crypto = require('crypto'); // For unique filenames

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only JSON, TXT, or ZIP files
    const allowedTypes = ['application/json', 'text/plain', 'application/zip'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JSON, TXT, and ZIP allowed.'));
    }
  }
});

// POST upload test case file
router.post('/upload-test-case', upload.single('testCaseFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const file = req.file;
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExtension}`;
    const filePath = `test-cases/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('test-cases')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('test-cases')
      .getPublicUrl(filePath);

    res.json({
      message: 'File uploaded successfully',
      fileName: fileName,
      filePath: filePath,
      publicUrl: urlData.publicUrl
    });

  } catch (err) {
    res.status(500).json({ message: 'Error uploading file', error: err.message });
  }
});

// POST create problem with file upload
router.post('/', upload.single('testCaseFile'), async (req, res) => {
  try {
    const { title, description, difficulty } = req.body;

    // Validate
    if (!title || !description || !difficulty) {
      return res.status(400).json({ message: 'Title, description, and difficulty are required' });
    }

    if (!['Easy', 'Medium', 'Hard'].includes(difficulty)) {
      return res.status(400).json({ message: 'Difficulty must be Easy, Medium, or Hard' });
    }

    let testCaseUrl = null;

    // If file is uploaded, store it
    if (req.file) {
      const file = req.file;
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExtension}`;
      const filePath = `test-cases/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('test-cases')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('test-cases')
        .getPublicUrl(filePath);

      testCaseUrl = urlData.publicUrl;
    } else if (req.body.test_case_url) {
      // Or use provided URL
      testCaseUrl = req.body.test_case_url;
    } else {
      return res.status(400).json({ message: 'Either upload a file or provide test_case_url' });
    }

    // Create problem in database
    const { data, error } = await supabase
      .from('problems')
      .insert([
        { title, description, difficulty, test_case_url: testCaseUrl, starter_code_url: req.body.starter_code_url || null }
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ message: 'Error creating problem', error: err.message });
  }
});

// GET single problem by ID
router.get('/:problemId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('problems')
      .select('*')
      .eq('id', req.params.problemId)
      .single();

    if (error || !data) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching problem', error: err.message });
  }
});

// GET download test case file
router.get('/:problemId/test-case', async (req, res) => {
  try {
    // Get problem to find file URL
    const { data: problem, error: problemError } = await supabase
      .from('problems')
      .select('test_case_url')
      .eq('id', req.params.problemId)
      .single();

    if (problemError || !problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    // Extract file path from URL
    const urlParts = problem.test_case_url.split('/storage/v1/object/public/test-cases/');
    if (urlParts.length < 2) {
      return res.status(400).json({ message: 'Invalid test case URL' });
    }
    const filePath = `test-cases/${urlParts[1]}`;

    // Download file from Supabase Storage
    const { data, error } = await supabase.storage
      .from('test-cases')
      .download(filePath);

    if (error) throw error;

    // Send file
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(Buffer.from(await data.arrayBuffer()));

  } catch (err) {
    res.status(500).json({ message: 'Error downloading file', error: err.message });
  }
});

// ... rest of your existing problem routes ...

module.exports = router;