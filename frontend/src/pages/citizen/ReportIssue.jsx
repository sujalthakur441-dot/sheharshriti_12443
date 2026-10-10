import React, { useEffect, useState } from "react";

import {
  MapPin,
  Camera,
  Video,
  Send,
  CheckCircle,
  Loader2,
  AlertCircle
} from "lucide-react";

import RoleLayout from "../../layouts/RoleLayout";


function ReportIssue() {

  // ==========================================
  // FORM STATE
  // ==========================================

  const [formData, setFormData] = useState({
    category: "",
    title: "",
    description: "",
    location: "",
    severity: "Medium"
  });


  // ==========================================
  // APPLICATION STATE
  // ==========================================

  const [submitted, setSubmitted] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const [incident, setIncident] = useState(null);

  // Evidence selected by the citizen (previewed before report submission).
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [videoPreview, setVideoPreview] = useState("");

  // Create and clean up preview URLs so browser memory is not leaked.
  useEffect(() => {
    const urls = selectedPhotos.map((file) => URL.createObjectURL(file));
    setPhotoPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [selectedPhotos]);

  useEffect(() => {
    if (!selectedVideo) {
      setVideoPreview("");
      return undefined;
    }

    const url = URL.createObjectURL(selectedVideo);
    setVideoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedVideo]);


  // ==========================================
  // HANDLE INPUT
  // ==========================================

  const handleChange = (event) => {

    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));

  };


  // ==========================================
  // HANDLE SUBMIT
  // ==========================================

  const handleSubmit = async (event) => {

    event.preventDefault();

    setError("");

    setSubmitting(true);


    try {

      const response = await fetch(
        "http://127.0.0.1:8000/api/reports/",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify(formData)
        }
      );


      const data = await response.json();


      // ======================================
      // BACKEND ERROR
      // ======================================

      if (!response.ok) {

        if (data.detail) {
          throw new Error(data.detail);
        }

        throw new Error(
          "Unable to submit the civic report."
        );

      }


      // ======================================
      // SUCCESS
      // ======================================

      setIncident(data.incident);

      setSubmitted(true);


    } catch (err) {

      console.error(
        "Report submission error:",
        err
      );

      setError(
        err.message ||
        "Something went wrong while submitting the report."
      );

    } finally {

      setSubmitting(false);

    }

  };


  // ==========================================
  // SUCCESS SCREEN
  // ==========================================

  if (submitted && incident) {

    return (

      <RoleLayout role="citizen">

        <div className="success-page">

          <div className="success-icon">

            <CheckCircle size={42} />

          </div>


          <span className="eyebrow">
            REPORT SUBMITTED
          </span>


          <h1>
            Issue reported successfully
          </h1>


          <p>
            Your civic report has been received by
            SheharShriti and is now ready for
            incident intelligence processing.
          </p>


          <div className="incident-id-card">

            <span>
              INCIDENT REFERENCE
            </span>


            <strong>
              {incident.incident_id}
            </strong>


            <small>
              Keep this reference to track your report.
            </small>

          </div>


          <div
            className="incident-summary-card"
            style={{
              width: "320px",
              marginBottom: "20px",
              padding: "16px",
              border: "1px solid #dfe4e9",
              borderRadius: "9px",
              background: "#ffffff",
              textAlign: "left"
            }}
          >

            <div style={{ marginBottom: "10px" }}>

              <span
                style={{
                  display: "block",
                  fontSize: "8px",
                  fontWeight: "700",
                  letterSpacing: "1px",
                  color: "#8b95a3"
                }}
              >
                ISSUE
              </span>

              <strong
                style={{
                  fontSize: "12px",
                  color: "#344054"
                }}
              >
                {incident.title}
              </strong>

            </div>


            <div style={{ marginBottom: "10px" }}>

              <span
                style={{
                  display: "block",
                  fontSize: "8px",
                  fontWeight: "700",
                  letterSpacing: "1px",
                  color: "#8b95a3"
                }}
              >
                STATUS
              </span>

              <span
                style={{
                  fontSize: "11px",
                  color: "#596678"
                }}
              >
                {incident.status}
              </span>

            </div>


            <div>

              <span
                style={{
                  display: "block",
                  fontSize: "8px",
                  fontWeight: "700",
                  letterSpacing: "1px",
                  color: "#8b95a3"
                }}
              >
                AI PROCESSING
              </span>

              <span
                style={{
                  fontSize: "11px",
                  color: "#596678"
                }}
              >
                {incident.ai_status}
              </span>

            </div>

          </div>


          <button
            className="primary-action"
            onClick={() => {

              setSubmitted(false);

              setIncident(null);

              setFormData({
                category: "",
                title: "",
                description: "",
                location: "",
                severity: "Medium"
              });

            }}
          >

            Report Another Issue

          </button>

        </div>

      </RoleLayout>

    );

  }


  // ==========================================
  // REPORT FORM
  // ==========================================

  return (

    <RoleLayout role="citizen">

      <div className="page-heading">

        <div>

          <span className="eyebrow">
            CITIZEN REPORTING
          </span>


          <h1>
            Report a Civic Issue
          </h1>


          <p>
            Help identify problems affecting your community.
          </p>

        </div>

      </div>


      {/* ======================================
          ERROR MESSAGE
      ======================================= */}

      {error && (

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "16px",
            padding: "12px 14px",
            border: "1px solid #e1caca",
            borderRadius: "8px",
            background: "#faf3f3",
            color: "#8b4b4b",
            fontSize: "11px"
          }}
        >

          <AlertCircle size={17} />

          <span>
            {error}
          </span>

        </div>

      )}


      <form
        className="report-layout"
        onSubmit={handleSubmit}
      >


        {/* ==================================
            MAIN FORM
        =================================== */}

        <div className="report-main">


          {/* ==================================
              ISSUE DETAILS
          =================================== */}

          <section className="content-card">

            <div className="card-heading">

              <div>

                <h2>
                  Issue Details
                </h2>

                <p>
                  Describe the problem clearly so
                  SheharShriti can understand and classify it.
                </p>

              </div>

            </div>


            {/* CATEGORY */}

            <div className="form-group">

              <label>
                Issue Category
              </label>


              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >

                <option value="">
                  Select category
                </option>

                <option value="road">
                  Road & Pothole
                </option>

                <option value="streetlight">
                  Streetlight
                </option>

                <option value="waste">
                  Waste Management
                </option>

                <option value="drainage">
                  Drainage
                </option>

                <option value="water">
                  Water Infrastructure
                </option>

                <option value="public-transport">
                  Public Transport
                </option>

                <option value="ev-charging">
                  EV Charging Station
                </option>

                <option value="other">
                  Other Civic Issue
                </option>

              </select>

            </div>


            {/* TITLE */}

            <div className="form-group">

              <label>
                Issue Title
              </label>


              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Example: Large pothole near main road"
                required
              />

            </div>


            {/* DESCRIPTION */}

            <div className="form-group">

              <label>
                Describe the Issue
              </label>


              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe what you observed..."
                rows="6"
                required
              />

            </div>


            {/* SEVERITY */}

            <div className="form-group">

              <label>
                Severity
              </label>


              <div className="severity-options">

                {["Low", "Medium", "High"].map(
                  (level) => (

                    <button
                      type="button"
                      key={level}
                      className={
                        formData.severity === level
                          ? "severity-option selected"
                          : "severity-option"
                      }
                      onClick={() =>
                        setFormData({
                          ...formData,
                          severity: level
                        })
                      }
                    >
                      {level}
                    </button>

                  )
                )}

              </div>

            </div>

          </section>


          {/* ==================================
              LOCATION
          =================================== */}

          <section className="content-card">

            <div className="card-heading">

              <div>

                <h2>
                  Issue Location
                </h2>

                <p>
                  Identify where the problem is located.
                </p>

              </div>

            </div>


            <div className="location-input">

              <MapPin size={18} />


              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Enter location or landmark"
                required
              />

            </div>


            <button
              type="button"
              className="secondary-action"
              onClick={() => {

                setFormData({
                  ...formData,
                  location: "Current device location"
                });

              }}
            >

              <MapPin size={16} />

              Use Current Location

            </button>

          </section>


          {/* ==================================
              EVIDENCE
          =================================== */}

          <section className="content-card">

            <div className="card-heading">

              <div>

                <h2>
                  Evidence
                </h2>

                <p>
                  Add photos or videos showing the issue.
                </p>

              </div>

            </div>


            <div className="upload-grid">


              <label className="upload-box">

                <Camera size={25} />

                <strong>
                  Add Photos
                </strong>

                <span>
                  JPG, PNG
                </span>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={(event) => {
                    const files = Array.from(event.target.files || []);
                    setSelectedPhotos(files);
                  }}
                />

              </label>


              <label className="upload-box">

                <Video size={25} />

                <strong>
                  Add Video
                </strong>

                <span>
                  MP4, MOV
                </span>

                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={(event) => {
                    setSelectedVideo(event.target.files?.[0] || null);
                  }}
                />

              </label>

            </div>

            {selectedPhotos.length > 0 && (
              <div style={{ marginTop: 18 }}>
                <div style={{ fontWeight: 700, marginBottom: 10 }}>
                  Selected photos ({selectedPhotos.length})
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                  {selectedPhotos.map((file, index) => (
                    <div
                      key={`${file.name}-${file.lastModified}-${index}`}
                      style={{ width: 112, minWidth: 0 }}
                    >
                      <img
                        src={photoPreviews[index]}
                        alt={file.name}
                        style={{
                          display: "block",
                          width: 112,
                          height: 88,
                          objectFit: "cover",
                          borderRadius: 8,
                          border: "1px solid #dfe4e9",
                        }}
                      />
                      <small
                        style={{
                          display: "block",
                          marginTop: 5,
                          overflowWrap: "anywhere",
                        }}
                      >
                        {file.name}
                      </small>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedVideo && (
              <div style={{ marginTop: 18 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>
                  Selected video: {selectedVideo.name}
                </div>
                {videoPreview && (
                  <video
                    src={videoPreview}
                    controls
                    preload="metadata"
                    style={{ width: "100%", maxWidth: 420, borderRadius: 10 }}
                  />
                )}
              </div>
            )}

          </section>

        </div>


        {/* ==================================
            RIGHT SIDEBAR
        =================================== */}

        <aside className="report-sidebar">


          {/* CHECKLIST */}

          <section className="content-card">

            <h2>
              Before You Submit
            </h2>


            <div className="report-checklist">

              <div>

                <CheckCircle size={15} />

                Describe the issue clearly

              </div>


              <div>

                <CheckCircle size={15} />

                Provide the correct location

              </div>


              <div>

                <CheckCircle size={15} />

                Add evidence if available

              </div>


              <div>

                <CheckCircle size={15} />

                Avoid reporting the same issue repeatedly

              </div>

            </div>

          </section>


          {/* AI INFORMATION */}

          <section className="ai-info-card">

            <span>
              SHEHARSHRITI AI
            </span>


            <h3>
              What happens after submission?
            </h3>


            <p>
              The report can later be analyzed by
              SheharShriti's intelligence layer to classify
              the issue, identify related reports, associate
              nearby infrastructure and recommend the
              responsible department.
            </p>

          </section>


          {/* SUBMIT */}

          <button
            type="submit"
            className="submit-report-button"
            disabled={submitting}
          >

            {submitting ? (

              <>
                <Loader2
                  size={17}
                  className="spin"
                />

                Submitting Report...

              </>

            ) : (

              <>
                <Send size={17} />

                Submit Civic Report
              </>

            )}

          </button>

        </aside>

      </form>

    </RoleLayout>

  );

}


export default ReportIssue;